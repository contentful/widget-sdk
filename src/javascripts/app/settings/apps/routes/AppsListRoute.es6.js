import React, { Component } from 'react';
import AdminOnly from 'app/common/AdminOnly.es6';
import AppsListPage from '../list/AppsListPage.es6';
import AppsClient from '../AppsClient.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';

const AppsFetcher = createFetcherComponent(() => {
  return AppsClient.getAll();
});

export default class AppsListRoute extends Component {
  onUninstall = (id, callback) => {
    AppsClient.uninstall(id).then(() => {
      callback();
    });
  };

  render() {
    return (
      <AdminOnly>
        <AppsFetcher>
          {({ isLoading, isError, data, fetch }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading apps..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }
            return (
              <AppsListPage
                apps={data}
                onUninstall={id => {
                  this.onUninstall(id, fetch);
                }}
              />
            );
          }}
        </AppsFetcher>
      </AdminOnly>
    );
  }
}
