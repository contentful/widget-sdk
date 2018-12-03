import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import createAppsClient from '../AppsClient.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import NetlifyPage from '../netlify/index.es6';
import AlgoliaPage from '../algolia/index.es6';

const NotFound = ({ app }) => (
  <div>
    <code>{app.id}/index.js</code> is not found
  </div>
);
NotFound.propTypes = {
  app: PropTypes.object.isRequired
};

const pages = {
  netlify: NetlifyPage,
  algolia: AlgoliaPage
};

const AppFetcher = createFetcherComponent(({ client, appId }) => {
  return client.get(appId);
});

export default class AppRoute extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    appId: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.client = createAppsClient(props.spaceId);
  }

  onInstall = (id, config, callback) => {
    this.client.save(id, config).then(() => callback());
  };

  onUninstall = (id, callback) => {
    this.client.remove(id).then(() => callback());
  };

  render() {
    return (
      <AdminOnly>
        <AppFetcher client={this.client} appId={this.props.appId}>
          {({ isLoading, isError, data, fetch }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading app..." />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            const Component = pages[data.id] || NotFound;
            return (
              <Component
                app={data}
                client={this.client}
                onInstall={(id, config) => {
                  this.onInstall(id, config, fetch);
                }}
                onUninstall={id => {
                  this.onUninstall(id, fetch);
                }}
              />
            );
          }}
        </AppFetcher>
      </AdminOnly>
    );
  }
}
