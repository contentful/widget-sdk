import * as React from 'react';
import PropTypes from 'prop-types';
import { NewApp } from './NewApp';
import { go } from 'states/Navigator';
import { ManagementApiClient } from './ManagementApiClient';
import { AppDefinition } from 'contentful-management/types';
import { AppDetailsStateProvider } from './AppDetails/AppDetailsStateContext';

export function NewAppRoute(props) {
  function goToDefinition(definitionId) {
    return go({ path: '^.definitions', params: { definitionId } });
  }

  function goToListView() {
    return go({ path: '^.list' });
  }

  return (
    <AppDetailsStateProvider
      definition={ManagementApiClient.createDefinitionTemplateForOrg(props.orgId) as AppDefinition}>
      <NewApp {...props} goToDefinition={goToDefinition} goToListView={goToListView} />
    </AppDetailsStateProvider>
  );
}

NewAppRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
