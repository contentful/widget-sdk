import * as React from 'react';
import PropTypes from 'prop-types';
import { NewApp } from './NewApp';
import { go } from 'states/Navigator';

export function NewAppRoute(props) {
  function goToDefinition(definitionId) {
    return go({ path: '^.definitions', params: { definitionId } });
  }

  function goToListView() {
    return go({ path: '^.list' });
  }

  return <NewApp {...props} goToDefinition={goToDefinition} goToListView={goToListView} />;
}

NewAppRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
