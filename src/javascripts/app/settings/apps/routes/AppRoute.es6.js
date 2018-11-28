import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import AppsClient from '../AppsClient.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import NetlifyPage from '../netlify/index.es6';

const NotFound = ({ app }) => (
  <div>
    <code>{app.id}/index.js</code> is not found
  </div>
);
NotFound.propTypes = {
  app: PropTypes.object.isRequired
};

const pages = {
  netlify: NetlifyPage
};

const AppFetcher = createFetcherComponent(props => {
  return AppsClient.get(props.appId);
});

export default class AppRoute extends Component {
  static propTypes = {
    appId: PropTypes.string.isRequired
  };

  onInstall = (id, callback) => {
    AppsClient.install(id).then(() => callback());
  };

  onUninstall = (id, callback) => {
    AppsClient.uninstall(id).then(() => callback());
  };

  render() {
    return (
      <AdminOnly>
        <AppFetcher appId={this.props.appId}>
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
                onInstall={id => {
                  this.onInstall(id, fetch);
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
