import React, { useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { SpacePurchaseContainer } from '../components/SpacePurchaseContainer';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  getBasePlan,
  getSpaceRatePlans,
  getSingleSpacePlan,
  isSelfServicePlan,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { fetchSpacePurchaseContent } from '../services/fetchSpacePurchaseContent';
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

const initialFetch = (orgId, spaceId, sessionId, dispatch) => async () => {
  const endpoint = createOrganizationEndpoint(orgId);

  const purchasingApps = await getVariation(FLAGS.COMPOSE_LAUNCH_PURCHASE);

  const [
    organization,
    organizationMembership,
    currentSpace,
    basePlan,
    rawSpaceRatePlans,
    freeSpaceResource,
    templatesList,
    pageContent,
  ] = await Promise.all([
    TokenStore.getOrganization(orgId),
    getOrganizationMembership(orgId),
    spaceId ? TokenStore.getSpace(spaceId) : undefined,
    getBasePlan(endpoint),
    getSpaceRatePlans(endpoint, spaceId),
    createResourceService(orgId, 'organization').get(FREE_SPACE_IDENTIFIER),
    getTemplatesList(),
    fetchSpacePurchaseContent(),
  ]);

  const canAccess =
    isOwnerOrAdmin(organization) && (isSelfServicePlan(basePlan) || isFreePlan(basePlan));

  if (!canAccess) {
    go({
      path: ['account', 'organizations', 'subscription_new'],
      params: { orgId },
    });

    return;
  }

  const spaceRatePlans = transformSpaceRatePlans(rawSpaceRatePlans, freeSpaceResource);

  let currentSpaceRatePlan;

  if (spaceId && spaceRatePlans.length > 0) {
    currentSpaceRatePlan = spaceRatePlans.find((plan) => plan.currentPlan);

    // if currentSpaceRatePlan was not found by checking unavailabilityReasons
    // it means this space is probably on a legacy plan (Micro or Small), so we need to use getSingleSpacePlan to get the rate plan
    if (!currentSpaceRatePlan) {
      currentSpaceRatePlan = await getSingleSpacePlan(endpoint, spaceId);
    }
  }

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
      organizationId: orgId,
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

  return {
    purchasingApps,
  };
};

export const SpacePurchaseRoute = ({ orgId, spaceId }) => {
  const sessionId = useMemo(() => alnum(16), []);
  const { dispatch } = useContext(SpacePurchaseState);

  const { data, error } = useAsync(
    useCallback(initialFetch(orgId, spaceId, sessionId, dispatch), [])
  );

  if (error) {
    return <ErrorState />;
  }

  return (
    <>
      <DocumentTitle title="Space purchase" />
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
        purchasingApps={data?.purchasingApps}
      />
    </>
  );
};

SpacePurchaseRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string,
};
