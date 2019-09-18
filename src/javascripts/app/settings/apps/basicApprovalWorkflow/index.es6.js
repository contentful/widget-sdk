import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import AppPageShell from '../_common/AppPageShell.es6';
import ApprovalWorkflowAppPage from './ApprovalWorkflowAppPage.es6';

const ApprovalWorkflowFetcher = createFetcherComponent(({ client }) => {
  const spaceContext = getModule('spaceContext');

  return Promise.all([client.get('basicApprovalWorkflow'), spaceContext.publishedCTs.getAllBare()]);
});

export default class ApprovalWorkflowApp extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    const spaceContext = getModule('spaceContext');
    const $state = getModule('$state');

    return (
      <ApprovalWorkflowFetcher client={this.props.client}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <AppPageShell appId="basicApprovalWorkflow" />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
          }

          const [app, contentTypes] = data;

          return (
            <ApprovalWorkflowAppPage
              client={this.props.client}
              cmaClient={spaceContext.cma}
              app={app}
              contentTypes={contentTypes}
              onGoBack={() => {
                $state.go('^.list');
              }}
            />
          );
        }}
      </ApprovalWorkflowFetcher>
    );
  }
}
