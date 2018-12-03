import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import spaceContext from 'spaceContext';
import contentPreview from 'contentPreview';

import NetlifyAppPage from './NetlifyAppPage.es6';
import * as NetlifyClient from './NetlifyClient.es6';

const NetlifyFetcher = createFetcherComponent(() => {
  return Promise.all([
    NetlifyClient.createTicket(),
    spaceContext.publishedCTs.getAllBare(),
    // We'll be updating content previews. Keep the content preview cache warm:
    contentPreview.getAll()
  ]);
});

export default class NetlifyApp extends Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    client: PropTypes.object.isRequired
  };

  render() {
    return (
      <NetlifyFetcher app={this.props.app}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading Netlify app..." />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
          }

          const [ticketId, contentTypes] = data;

          return (
            <NetlifyAppPage
              app={this.props.app}
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
