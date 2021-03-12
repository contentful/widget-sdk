import React, { useMemo, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';

import { getQueryString } from 'utils/location';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { SpacePurchaseContainer } from '../components/SpacePurchaseContainer';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import {
  isSelfServicePlan,
  getPlansWithSpaces,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import {
  fetchSpacePurchaseContent,
  fetchPlatformPurchaseContent,
} from '../services/fetchSpacePurchaseContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { PLATFORM_CONTENT } from '../utils/platformContent';
import { alnum } from 'utils/Random';
import * as TokenStore from 'services/TokenStore';
import { getOrganizationMembership } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import ErrorState from 'app/common/ErrorState';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { transformSpaceRatePlans } from '../utils/transformSpaceRatePlans';
import {
  getAddOnProductRatePlans,
  getSpaceProductRatePlans,
  getSpacePlans,
  getBasePlan,
  getSpacePlanForSpace,
} from 'features/pricing-entities';

import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { actions, SpacePurchaseState } from '../context';
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';

const CREATE_SPACE_SESSION = 'create_space';
const UPGRADE_SPACE_SESSION = 'upgrade_space';

/**
 * List of possible values for the "preselect" param in this route
 */
export const PRESELECT_VALUES = {
  APPS: 'apps',
};

const initialFetch = (organizationId, spaceId, from, preselectApps, dispatch) => async () => {
  const endpoint = createOrganizationEndpoint(organizationId);
  const spaceEndpoint = createSpaceEndpoint(spaceId);

  const isAppPurchasingEnabled = await getVariation(FLAGS.COMPOSE_LAUNCH_PURCHASE, {
    organizationId,
  });

  let hasPurchasedComposeLaunch;
  let composeAndLaunchProductRatePlan;

  if (isAppPurchasingEnabled) {
    const [addOnProductRatePlans, plans] = await Promise.all([
      getAddOnProductRatePlans(endpoint),
      getPlansWithSpaces(endpoint),
    ]);

    // TODO(jo-sm): We should be smarter about this, using `find`, once the `internalName` is finalized.
    composeAndLaunchProductRatePlan = addOnProductRatePlans[0];

    hasPurchasedComposeLaunch = !!plans.items.find((plan) => {
      return plan.productRatePlanId === composeAndLaunchProductRatePlan.sys.id;
    });
  }

  let selectedPlatform;

  if (preselectApps && !hasPurchasedComposeLaunch) {
    selectedPlatform = {
      ...PLATFORM_CONTENT.COMPOSE_AND_LAUNCH,
      price: composeAndLaunchProductRatePlan?.price,
    };
  }

  // Only should be purchasing apps if purchasing of apps is enabled and they haven't purchased compose+launch yet.
  const purchasingApps = isAppPurchasingEnabled && !hasPurchasedComposeLaunch;

  // Dispatch currentSpace early so we can define if the user is creating or changing a space
  if (spaceId) {
    const currentSpace = await getSpace(spaceEndpoint);

    dispatch({ type: actions.SET_CURRENT_SPACE, payload: currentSpace });
  }

  dispatch({ type: actions.SET_PURCHASING_APPS, payload: purchasingApps });

  const [
    organization,
    organizationMembership,
    basePlan,
    currentSpaceRatePlan,
    rawSpaceRatePlans,
    subscriptionPlans,
    freeSpaceResource,
    templatesList,
    pageContent,
  ] = await Promise.all([
    TokenStore.getOrganization(organizationId),
    getOrganizationMembership(organizationId),
    getBasePlan(endpoint),
    spaceId ? getSpacePlanForSpace(endpoint, spaceId) : undefined,
    getSpaceProductRatePlans(endpoint, spaceId),
    getSpacePlans(endpoint),
    createResourceService(organizationId, 'organization').get(FREE_SPACE_IDENTIFIER),
    getTemplatesList(),
    purchasingApps ? fetchPlatformPurchaseContent() : fetchSpacePurchaseContent(),
  ]);

  const canAccess =
    isOwnerOrAdmin(organization) && (isSelfServicePlan(basePlan) || isFreePlan(basePlan));

  if (!canAccess) {
    go({
      path: ['account', 'organizations', 'subscription_new'],
      params: { orgId: organizationId },
    });

    return;
  }

  const spaceRatePlans = transformSpaceRatePlans(rawSpaceRatePlans, freeSpaceResource);

  const sessionId = alnum(16);

  dispatch({
    type: actions.SET_INITIAL_STATE,
    payload: {
      organization,
      currentSpaceRatePlan,
      sessionId,
      templatesList,
      spaceRatePlans,
      subscriptionPlans,
      freeSpaceResource,
      pageContent,
      selectedPlatform,
      composeAndLaunchProductRatePlan,
      purchasingApps,
    },
  });

  // TODO: Once trials is further along, add logic to verify if user is in trial or not.
  // Now that all the data has been loaded (and dispatched), we can track the "begin" event
  trackEvent(
    EVENTS.BEGIN,
    {
      organizationId,
      spaceId,
      sessionId,
    },
    {
      userOrganizationRole: organizationMembership.role,
      organizationPlatform: basePlan.customerType,
      canCreateFreeSpace: !resourceIncludedLimitReached(freeSpaceResource),
      sessionType: spaceId ? UPGRADE_SPACE_SESSION : CREATE_SPACE_SESSION,
      currentSpacePlan: currentSpaceRatePlan,
      canPurchaseApps: isAppPurchasingEnabled ? !hasPurchasedComposeLaunch : undefined,
      from,
      performancePackagePreselected: !!selectedPlatform,
    }
  );
};

export const SpacePurchaseRoute = ({
  orgId,
  spaceId,
  from: fromRouterParam,
  preselect: preselectRouterParam,
}) => {
  // TODO(jo-sm): This should become a hook at some point
  const queryParams = useMemo(() => getQueryString(), []);

  // We do this to allow the use of a URL like /new_space?from= from an external place
  // like the marketing website, while also allowing it to be used internally
  // via `go(...)`. This should become unnecessary or changed when moving from ui-router.
  const from = fromRouterParam ? fromRouterParam : queryParams.from;
  const preselect = preselectRouterParam ? preselectRouterParam : queryParams.preselect;

  const preselectApps = preselect === PRESELECT_VALUES.APPS;

  const {
    state: { sessionId, purchasingApps },
    dispatch,
  } = useContext(SpacePurchaseState);

  // We load `purchasingApps` state separately from the other state so that the `SpacePurchaseContainer`
  // knows which specific first step component to display (with its loading state). Not separating them
  // will cause an empty screen while all the data loads, which is undesireable.
  const { error } = useAsync(
    useCallback(initialFetch(orgId, spaceId, from, preselectApps, dispatch), [])
  );

  // Show the generic loading state until we know if we're purchasing apps or not
  if (purchasingApps === undefined) {
    return (
      <EmptyStateContainer>
        <FetcherLoading />
      </EmptyStateContainer>
    );
  }

  if (error) {
    return <ErrorState />;
  }

  const documentTitle = purchasingApps ? 'Subscription purchase' : 'Space purchase';

  return (
    <>
      <DocumentTitle title={documentTitle} />
      <SpacePurchaseContainer
        preselectApps={preselectApps}
        track={(eventName, metadata) => {
          trackEvent(
            eventName,
            {
              organizationId: orgId,
              spaceId,
              sessionId,
            },
            metadata
          );
        }}
      />
    </>
  );
};

SpacePurchaseRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string,
  from: PropTypes.string,
  preselect: PropTypes.string,
};
