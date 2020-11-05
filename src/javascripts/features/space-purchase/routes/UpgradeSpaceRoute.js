import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { NewSpacePage } from '../components/NewSpacePage';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  getRatePlans,
  getBasePlan,
  isSelfServicePlan,
  isFreePlan,
  getSpaceRatePlans,
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
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';

function createEventMetadataFromData(data, sessionType) {
  const { organizationMembership, basePlan, canCreateFreeSpace, currentSpacePlan } = data;

  return {
    userOrganizationRole: organizationMembership.role,
    organizationPlatform: basePlan.customerType,
    canCreateFreeSpace,
    sessionType,
    currentSpacePlan: currentSpacePlan,
  };
}

const initialFetch = (orgId, spaceId) => async () => {
  const endpoint = createOrganizationEndpoint(orgId);

  const [
    organization,
    newPurchaseFlowIsEnabled,
    templatesList,
    productRatePlans,
    basePlan,
    freeSpaceResource,
    pageContent,
    organizationMembership,
    currentSpace,
    rawSpaceRatePlans,
  ] = await Promise.all([
    TokenStore.getOrganization(orgId),
    getVariation(FLAGS.NEW_PURCHASE_FLOW),
    getTemplatesList(),
    getRatePlans(endpoint),
    getBasePlan(endpoint),
    createResourceService(orgId, 'organization').get(FREE_SPACE_IDENTIFIER),
    fetchSpacePurchaseContent(),
    getOrganizationMembership(orgId),
    TokenStore.getSpace(spaceId),
    getSpaceRatePlans(endpoint, spaceId),
  ]);

  const spaceRatePlans = transformSpaceRatePlans({
    spaceRatePlans: rawSpaceRatePlans,
    freeSpaceResource,
  });

  let currentSpacePlan;
  if (spaceId && spaceRatePlans) {
    currentSpacePlan = spaceRatePlans.find((plan) =>
      plan.unavailabilityReasons?.find((reason) => reason.type === 'currentPlan')
    );
  }

  const canAccess =
    newPurchaseFlowIsEnabled &&
    isOwnerOrAdmin(organization) &&
    (isSelfServicePlan(basePlan) || isFreePlan(basePlan));

  if (!canAccess) {
    go({
      path: ['account', 'organizations', 'subscription_new'],
      params: { orgId },
    });

    return;
  }

  // User can't create another community plan if they've already reached their limit
  const canCreateFreeSpace = !resourceIncludedLimitReached(freeSpaceResource);

  return {
    organization,
    templatesList,
    productRatePlans,
    canCreateFreeSpace,
    pageContent,
    basePlan,
    organizationMembership,
    newPurchaseFlowIsEnabled,
    currentSpace,
    spaceRatePlans,
    currentSpacePlan,
  };
};

export const UpgradeSpaceRoute = ({ orgId, spaceId }) => {
  const sessionMetadata = {
    sessionId: alnum(16),
    organizationId: orgId,
  };

  const trackWithSession = (eventName, eventMetadata) => {
    trackEvent(eventName, sessionMetadata, eventMetadata);
  };

  const { isLoading, data, error } = useAsync(useCallback(initialFetch(orgId, spaceId), []));

  useEffect(() => {
    if (!isLoading && data?.newPurchaseFlowIsEnabled) {
      const sessionType = 'change_space';
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
        loading={isLoading}
        sessionMetadata={sessionMetadata}
        trackWithSession={trackWithSession}
        organization={data?.organization}
        templatesList={data?.templatesList}
        productRatePlans={data?.productRatePlans}
        canCreateCommunityPlan={data?.canCreateFreeSpace}
        pageContent={data?.pageContent}
        currentSpace={data?.currentSpace}
        spaceRatePlans={data?.spaceRatePlans}
        currentSpacePlan={data?.currentSpacePlan}
      />
    </>
  );
};

UpgradeSpaceRoute.propTypes = {
  orgId: PropTypes.string,
  spaceId: PropTypes.string,
};