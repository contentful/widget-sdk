import * as React from 'react';
import PropTypes from 'prop-types';
import { NewApp } from './NewApp';
import { ManagementApiClient } from './ManagementApiClient';
import { AppDefinition } from 'contentful-management/types';
import { AppDetailsStateProvider } from './AppDetails/AppDetailsStateContext';
import { useRouteNavigate } from 'core/react-routing';

export function NewAppRoute(props) {
  const routeNavigate = useRouteNavigate();

  function goToDefinition(definitionId) {
    return routeNavigate({
      path: 'organizations.apps.definition',
      definitionId,
      orgId: props.orgId,
    });
  }

  function goToListView() {
    return routeNavigate({ path: 'organizations.apps.list', orgId: props.orgId });
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
