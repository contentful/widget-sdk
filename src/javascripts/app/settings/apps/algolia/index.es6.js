import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import AppPageShell from '../_common/AppPageShell.es6';

import AlgoliaAppPage from './Container.es6';

const spaceContext = getModule('spaceContext');

const AlgoliaFetcher = createFetcherComponent(({ client }) => {
  return Promise.all([
    client.get('algolia'),
    spaceContext.publishedCTs.getAllBare(),
    spaceContext.localeRepo.getAll()
  ]);
});

export default class AlgoliaApp extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    return (
      <AlgoliaFetcher client={this.props.client}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <AppPageShell appId="algolia" />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
          }

          const [app, allContentTypes, locales, allWebhooks] = data;

          return (
            <AlgoliaAppPage
              app={app}
              allContentTypes={allContentTypes}
              allWebhooks={allWebhooks}
              locales={locales}
              client={this.props.client}
            />
          );
        }}
      </AlgoliaFetcher>
    );
  }
}
