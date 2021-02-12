import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';

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
import { getSpaces, getSpace } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import {
  fetchSpacePurchaseContent,
  fetchPlatformPurchaseContent,
} from '../services/fetchSpacePurchaseContent';
import { PlatformKind } from 'features/space-purchase/utils/platformContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
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

const initialFetch = (organizationId, spaceId, viaMarketingCTA, from, dispatch) => async () => {
  const endpoint = createOrganizationEndpoint(organizationId);
  const spaceEndpoint = createSpaceEndpoint(spaceId);

  const isAppPurchasingEnabled = await getVariation(FLAGS.COMPOSE_LAUNCH_PURCHASE, {
    organizationId,
  });

  let hasPurchasedComposeLaunch, composeAndLaunchProductRatePlan;
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

  // Only should be purchasing apps if purchasing of apps is enabled and they haven't purchased compose+launch yet.
  const purchasingApps = isAppPurchasingEnabled && !hasPurchasedComposeLaunch;

  dispatch({ type: actions.SET_PURCHASING_APPS, payload: purchasingApps });

  const [
    organization,
    orgSpaceMetadata,
    organizationMembership,
    currentSpace,
    currentSpaceRatePlan,
    basePlan,
    rawSpaceRatePlans,
    subscriptionPlans,
    freeSpaceResource,
    templatesList,
    pageContent,
  ] = await Promise.all([
    TokenStore.getOrganization(organizationId),

    // We don't care about the actual space data, just the total number of spaces in the org
    getSpaces(endpoint, { limit: 0 }),
    getOrganizationMembership(organizationId),
    spaceId ? getSpace(spaceEndpoint) : undefined,
    spaceId ? getSpacePlanForSpace(endpoint, spaceId) : undefined,
    getBasePlan(endpoint),
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

  const numSpacesInOrg = orgSpaceMetadata.total;
  let selectedPlatform;

  if (viaMarketingCTA && numSpacesInOrg === 0) {
    selectedPlatform = PlatformKind.SPACE_COMPOSE_LAUNCH;
  }

  const sessionId = alnum(16);

  dispatch({
    type: actions.SET_INITIAL_STATE,
    payload: {
      organization,
      currentSpaceRatePlan,
      currentSpace,
      sessionId,
      templatesList,
      spaceRatePlans,
      subscriptionPlans,
      freeSpaceResource,
      pageContent,
      selectedPlatform,
      composeAndLaunchProductRatePlan,
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
      performancePackagePreselected: viaMarketingCTA,
    }
  );
};

export const SpacePurchaseRoute = ({ orgId, spaceId, viaMarketingCTA, from }) => {
  const {
    state: { sessionId, purchasingApps },
    dispatch,
  } = useContext(SpacePurchaseState);

  // We load `purchasingApps` state separately from the other state so that the `SpacePurchaseContainer`
  // knows which specific first step component to display (with its loading state). Not separating them
  // will cause an empty screen while all the data loads, which is undesireable.
  const { error } = useAsync(
    useCallback(initialFetch(orgId, spaceId, viaMarketingCTA, from, dispatch), [])
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
  viaMarketingCTA: PropTypes.bool.isRequired,
  from: PropTypes.string,
};
