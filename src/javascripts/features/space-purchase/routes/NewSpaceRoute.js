import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Spinner } from '@contentful/forma-36-react-components';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { NewSpacePage } from '../components/NewSpacePage';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import StateRedirect from 'app/common/StateRedirect';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { getBasePlan, getRatePlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { fetchSpacePurchaseContent } from '../services/fetchSpacePurchaseContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { alnum } from 'utils/Random';
import * as TokenStore from 'services/TokenStore';
import { getOrganizationMembership } from 'services/OrganizationRoles';

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
    freeSpaceResource,
    pageContent,
    basePlan,
    organizationMembership,
  ] = await Promise.all([
    TokenStore.getOrganization(orgId),
    getVariation(FLAGS.NEW_PURCHASE_FLOW),
    getTemplatesList(),
    getRatePlans(endpoint),
    createResourceService(orgId, 'organization').get('free_space'),
    fetchSpacePurchaseContent(),
    getBasePlan(endpoint),
    getOrganizationMembership(orgId),
  ]);

  // User can't create another community plan if they've already reached their limit
  const canCreateFreeSpace = !resourceIncludedLimitReached(freeSpaceResource);

  return {
    organization,
    newPurchaseFlowIsEnabled,
    templatesList,
    productRatePlans,
    canCreateFreeSpace,
    pageContent,
    basePlan,
    organizationMembership,
  };
};

export const NewSpaceRoute = ({ orgId }) => {
  const sessionMetadata = {
    sessionId: alnum(16),
    organizationId: orgId,
  };

  const { isLoading, data } = useAsync(useCallback(initialFetch(orgId), []));

  useEffect(() => {
    if (!isLoading && data?.newPurchaseFlowIsEnabled) {
      const eventMetadata = createEventMetadataFromData(data);

      trackEvent(EVENTS.BEGIN, sessionMetadata, eventMetadata);
    }
  }, [isLoading, sessionMetadata, data]);

  if (isLoading) {
    return (
      <EmptyStateContainer>
        <Spinner testId="space-route-loading" size="large" />
      </EmptyStateContainer>
    );
  }

  if (data && !data.newPurchaseFlowIsEnabled) {
    return <StateRedirect path="home" />;
  }

  return (
    <>
      <DocumentTitle title="Space purchase" />
      <NewSpacePage
        sessionMetadata={sessionMetadata}
        organization={data.organization}
        templatesList={data.templatesList}
        productRatePlans={data.productRatePlans}
        canCreateCommunityPlan={data.canCreateCommunityPlan}
        pageContent={data.pageContent}
      />
    </>
  );
};

NewSpaceRoute.propTypes = {
  orgId: PropTypes.string,
};
