import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Spinner } from '@contentful/forma-36-react-components';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { NewSpacePage } from '../components/NewSpacePage';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  getRatePlans,
  getBasePlan,
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

function createEventMetadataFromData(data) {
  const { organizationMembership, basePlan, canCreateFreeSpace } = data;

  return {
    userOrganizationRole: organizationMembership.role,
    organizationPlatform: basePlan.customerType,
    canCreateFreeSpace,
  };
}

const initialFetch = (orgId) => async () => {
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
  ] = await Promise.all([
    TokenStore.getOrganization(orgId),
    getVariation(FLAGS.NEW_PURCHASE_FLOW),
    getTemplatesList(),
    getRatePlans(endpoint),
    getBasePlan(endpoint),
    createResourceService(orgId, 'organization').get('free_space'),
    fetchSpacePurchaseContent(),
    getOrganizationMembership(orgId),
  ]);

  const canAccess =
    newPurchaseFlowIsEnabled &&
    isOwnerOrAdmin(organization) &&
    (isSelfServicePlan(basePlan) || isFreePlan(basePlan));

  if (!canAccess) {
    go({
      path: ['account', 'organizations', 'subscription_new', 'overview'],
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
  };
};

export const NewSpaceRoute = ({ orgId }) => {
  const sessionMetadata = {
    sessionId: alnum(16),
    organizationId: orgId,
  };

  const { isLoading, data, error } = useAsync(useCallback(initialFetch(orgId), []));

  useEffect(() => {
    if (!isLoading && data?.newPurchaseFlowIsEnabled) {
      const eventMetadata = createEventMetadataFromData(data);

      trackEvent(EVENTS.BEGIN, sessionMetadata, eventMetadata);
    }
  }, [isLoading, sessionMetadata, data]);

  if (error) {
    return <ErrorState />;
  }

  if (isLoading || !data) {
    return (
      <EmptyStateContainer>
        <Spinner testId="space-route-loading" size="large" />
      </EmptyStateContainer>
    );
  }

  return (
    <>
      <DocumentTitle title="Space purchase" />
      <NewSpacePage
        sessionMetadata={sessionMetadata}
        organization={data.organization}
        templatesList={data.templatesList}
        productRatePlans={data.productRatePlans}
        canCreateCommunityPlan={data.canCreateFreeSpace}
        pageContent={data.pageContent}
      />
    </>
  );
};

NewSpaceRoute.propTypes = {
  orgId: PropTypes.string,
};
