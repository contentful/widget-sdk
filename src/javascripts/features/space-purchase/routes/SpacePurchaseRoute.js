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
  getBasePlan,
  getSpaceRatePlans,
  getSingleSpacePlan,
  isSelfServicePlan,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import {
  fetchSpacePurchaseContent,
  fetchPlatformPurchaseContent,
} from '../services/fetchSpacePurchaseContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { alnum } from 'utils/Random';
import * as TokenStore from 'services/TokenStore';
import { getOrganizationMembership } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import ErrorState from 'app/common/ErrorState';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { transformSpaceRatePlans } from '../utils/transformSpaceRatePlans';

import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { actions, SpacePurchaseState } from '../context';
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';

const CREATE_SPACE_SESSION = 'create_space';
const UPGRADE_SPACE_SESSION = 'upgrade_space';

const initialFetch = (organizationId, spaceId, dispatch) => async () => {
  const endpoint = createOrganizationEndpoint(organizationId);

  const purchasingApps = await getVariation(FLAGS.COMPOSE_LAUNCH_PURCHASE, { organizationId });

  dispatch({ type: actions.SET_PURCHASING_APPS, payload: purchasingApps });

  const [
    organization,
    organizationMembership,
    currentSpace,
    currentSpaceRatePlan,
    basePlan,
    rawSpaceRatePlans,
    freeSpaceResource,
    templatesList,
    pageContent,
  ] = await Promise.all([
    TokenStore.getOrganization(organizationId),
    getOrganizationMembership(organizationId),
    spaceId ? TokenStore.getSpace(spaceId) : undefined,
    spaceId ? getSingleSpacePlan(endpoint, spaceId) : undefined,
    getBasePlan(endpoint),
    getSpaceRatePlans(endpoint, spaceId),
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
      currentSpace,
      currentSpaceRatePlan,
      sessionId,
      templatesList,
      spaceRatePlans,
      freeSpaceResource,
      pageContent,
    },
  });

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
    }
  );
};

export const SpacePurchaseRoute = ({ orgId, spaceId }) => {
  const {
    state: { sessionId, purchasingApps },
    dispatch,
  } = useContext(SpacePurchaseState);

  // We load `purchasingApps` state separately from the other state so that the `SpacePurchaseContainer`
  // knows which specific first step component to display (with its loading state). Not separating them
  // will cause an empty screen while all the data loads, which is undesireable.
  const { error } = useAsync(useCallback(initialFetch(orgId, spaceId, dispatch), []));

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
};
