import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { Spinner } from '@contentful/forma-36-react-components';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { NewSpacePage } from '../components/NewSpacePage';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import StateRedirect from 'app/common/StateRedirect';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { getRatePlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { fetchSpacePurchaseContent } from '../services/fetchSpacePurchaseContent';

const initialFetch = (orgId) => async () => {
  const endpoint = createOrganizationEndpoint(orgId);

  const [
    newPurchaseFlowIsEnabled,
    templatesList,
    productRatePlans,
    freeSpaceResource,
    pageContent,
  ] = await Promise.all([
    getVariation(FLAGS.NEW_PURCHASE_FLOW),
    getTemplatesList(),
    getRatePlans(endpoint),
    createResourceService(orgId, 'organization').get('free_space'),
    fetchSpacePurchaseContent(),
  ]);

  // User can't create another community plan if they've already reached their limit
  const canCreateCommunityPlan = !resourceIncludedLimitReached(freeSpaceResource);

  return {
    newPurchaseFlowIsEnabled,
    templatesList,
    productRatePlans,
    canCreateCommunityPlan,
    pageContent,
  };
};

export const NewSpaceRoute = ({ orgId }) => {
  const { isLoading, data } = useAsync(useCallback(initialFetch(orgId), []));

  if (isLoading) {
    return (
      <EmptyStateContainer>
        <Spinner size="large" />
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
        organizationId={orgId}
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
