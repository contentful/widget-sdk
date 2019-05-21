import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';

import StateRedirect from 'app/common/StateRedirect.es6';
import AppPageShell from '../_common/AppPageShell.es6';
import OptimizelyApp from './OptimizelyApp.es6';

const spaceContext = getModule('spaceContext');

const OptimizelyFetcher = createFetcherComponent(async ({ client }) => {
  return Promise.all([client.get('optimizely'), spaceContext.cma.getContentTypes()]);
});

export default class Index extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    return (
      <OptimizelyFetcher client={this.props.client}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <AppPageShell appId="optimizely" />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
          }

          const [app, allContentTypes] = data;

          return (
            <OptimizelyApp
              client={this.props.client}
              app={app}
              allContentTypes={allContentTypes.items}
            />
          );
        }}
      </OptimizelyFetcher>
    );
  }
}
