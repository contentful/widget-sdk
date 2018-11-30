import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import NetlifyAppPage from './NetlifyAppPage.es6';
import * as NetlifyClient from './NetlifyClient.es6';

const NetlifyFetcher = createFetcherComponent(({ app }) => {
  return Promise.all([app, NetlifyClient.createTicket()]);
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

          const [app, ticketId] = data;

          return <NetlifyAppPage app={app} ticketId={ticketId} client={this.props.client} />;
        }}
      </NetlifyFetcher>
    );
  }
}
