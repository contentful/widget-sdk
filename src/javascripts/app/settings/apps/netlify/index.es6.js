import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';

import NetlifyAppPage from './NetlifyAppPage.es6';
import * as NetlifyClient from './NetlifyClient.es6';
import AppPageShell from '../_common/AppPageShell.es6';
import * as AppsFeatureFlag from '../AppsFeatureFlag.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const contentPreview = getModule('contentPreview');

const NetlifyFetcher = createFetcherComponent(async ({ client }) => {
  await AppsFeatureFlag.assertIsEnabled();

  return Promise.all([
    client.get('netlify'),
    NetlifyClient.createTicket(),
    spaceContext.publishedCTs.getAllBare(),
    // We'll be updating content previews. Keep the content preview cache warm:
    contentPreview.getAll()
  ]);
});

export default class NetlifyApp extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    return (
      <NetlifyFetcher client={this.props.client}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <AppPageShell appId="netlify" />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
          }

          const [app, ticketId, contentTypes] = data;
          return (
            <NetlifyAppPage
              app={app}
              ticketId={ticketId}
              contentTypeIds={contentTypes.map(ct => ct.sys.id)}
              client={this.props.client}
            />
          );
        }}
      </NetlifyFetcher>
    );
  }
}
