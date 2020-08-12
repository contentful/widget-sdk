import React, { useCallback } from 'react';

import { Spinner } from '@contentful/forma-36-react-components';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { NewSpacePage } from '../components/NewSpacePage';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import StateRedirect from 'app/common/StateRedirect';

const initialFetch = () => async () => {
  const newPurchaseFlowIsEnabled = await getVariation(FLAGS.NEW_PURCHASE_FLOW);

  return {
    newPurchaseFlowIsEnabled,
  };
};

export const NewSpaceRoute = () => {
  const { isLoading, data } = useAsync(useCallback(initialFetch(), []));

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
      <NewSpacePage />
    </>
  );
};
