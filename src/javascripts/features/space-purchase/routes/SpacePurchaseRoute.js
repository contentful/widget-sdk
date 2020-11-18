import React, { useCallback, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { NewSpacePage } from '../components/NewSpacePage';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  getRatePlans,
  getBasePlan,
  getSpaceRatePlans,
  isSelfServicePlan,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { fetchSpacePurchaseContent } from '../services/fetchSpacePurchaseContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { alnum } from 'utils/Random';
import * as TokenStore from 'services/TokenStore';
import { getOrganizationMembership } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import ErrorState from 'app/common/ErrorState';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { transformSpaceRatePlans } from '../utils/transformSpaceRatePlans';

import { actions, SpacePurchaseState } from '../context';
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';

const CREATE_SPACE_SESSION = 'create_space';
const UPGRADE_SPACE_SESSION = 'upgrade_space';

function createEventMetadataFromData(data, sessionType) {
  const { organizationMembership, basePlan, canCreateFreeSpace, currentSpaceRatePlan } = data;

  // Note: currentSpaceRatePlan will be null when upgrading a micro or small space, or creating when a new space

  return {
    userOrganizationRole: organizationMembership.role,
    organizationPlatform: basePlan.customerType,
    canCreateFreeSpace,
    sessionType,
    currentSpacePlan: currentSpaceRatePlan,
  };
}

const initialFetch = (orgId, spaceId, dispatch) => async () => {
  const endpoint = createOrganizationEndpoint(orgId);

  const [
    organization,
    templatesList,
    productRatePlans,
    basePlan,
    freeSpaceResource,
    pageContent,
    organizationMembership,
    currentSpace,
    rawSpaceRatePlans,
    composeLaunchPurchaseEnabled,
  ] = await Promise.all([
    TokenStore.getOrganization(orgId),
    getTemplatesList(),
    getRatePlans(endpoint),
    getBasePlan(endpoint),
    createResourceService(orgId, 'organization').get(FREE_SPACE_IDENTIFIER),
    fetchSpacePurchaseContent(),
    getOrganizationMembership(orgId),
    spaceId ? TokenStore.getSpace(spaceId) : undefined,
    getSpaceRatePlans(endpoint, spaceId),
    getVariation(FLAGS.COMPOSE_LAUNCH_PURCHASE),
  ]);

  const spaceRatePlans = transformSpaceRatePlans({
    spaceRatePlans: rawSpaceRatePlans,
    freeSpaceResource,
  });

  let currentSpaceRatePlan;
  if (spaceId && spaceRatePlans?.length > 0) {
    currentSpaceRatePlan = spaceRatePlans.find((plan) =>
      plan.unavailabilityReasons?.find((reason) => reason.type === 'currentPlan')
    );
  }

  const canAccess =
    isOwnerOrAdmin(organization) && (isSelfServicePlan(basePlan) || isFreePlan(basePlan));

  if (!canAccess) {
    go({
      path: ['account', 'organizations', 'subscription_new'],
      params: { orgId },
    });

    return;
  }

  // User can't create another community plan if they've already reached their limit
  const canCreateFreeSpace = !resourceIncludedLimitReached(freeSpaceResource);

  dispatch({
    type: actions.SET_INITIAL_STATE,
    payload: {
      organization,
      currentSpace,
      currentSpaceRatePlan,
      sessionId: alnum(16),
    },
  });

  return {
    organization,
    templatesList,
    productRatePlans,
    canCreateFreeSpace,
    pageContent,
    basePlan,
    organizationMembership,
    currentSpace,
    spaceRatePlans,
    currentSpaceRatePlan,
    composeLaunchPurchaseEnabled,
  };
};

export const SpacePurchaseRoute = ({ orgId, spaceId }) => {
  const {
    dispatch,
    state: { sessionId },
  } = useContext(SpacePurchaseState);

  const sessionMetadata = {
    organizationId: orgId,
    sessionId,
    spaceId,
  };

  const trackWithSession = (eventName, eventMetadata) => {
    trackEvent(eventName, sessionMetadata, eventMetadata);
  };

  const { isLoading, data, error } = useAsync(
    useCallback(initialFetch(orgId, spaceId, dispatch), [])
  );

  useEffect(() => {
    if (!isLoading && data) {
      const sessionType = spaceId ? UPGRADE_SPACE_SESSION : CREATE_SPACE_SESSION;
      const eventMetadata = createEventMetadataFromData(data, sessionType);

      trackWithSession(EVENTS.BEGIN, eventMetadata);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, data]);

  if (error) {
    return <ErrorState />;
  }

  return (
    <>
      <DocumentTitle title="Space purchase" />
      <NewSpacePage
        trackWithSession={trackWithSession}
        organization={data?.organization}
        templatesList={data?.templatesList}
        productRatePlans={data?.productRatePlans}
        canCreateCommunityPlan={data?.canCreateFreeSpace}
        pageContent={data?.pageContent}
        currentSpace={data?.currentSpace}
        spaceRatePlans={data?.spaceRatePlans}
        currentSpacePlan={data?.currentSpaceRatePlan}
        composeLaunchPurchaseEnabled={data?.composeLaunchPurchaseEnabled}
      />
    </>
  );
};

SpacePurchaseRoute.propTypes = {
  orgId: PropTypes.string,
  spaceId: PropTypes.string,
};
