import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import AppsListPage, { AppsListPageLoading } from '../list/AppsListPage.es6';
import createAppsClient from '../AppsClient.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';

const AppsFetcher = createFetcherComponent(async ({ spaceId }) => {
  const apps = await createAppsClient(spaceId).getAll();

  return apps.reduce(
    ({ installed, rest }, app) => {
      if (app.installed) {
        return { installed: installed.concat([app]), rest };
      } else {
        return { installed, rest: rest.concat([app]) };
      }
    },
    { installed: [], rest: [] }
  );
});

export default class AppsListRoute extends Component {
  static propTypes = {
    hasBasicApps: PropTypes.bool.isRequired,
    spaceId: PropTypes.string.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <AppsFetcher spaceId={this.props.spaceId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <AppsListPageLoading />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }
            return <AppsListPage hasBasicApps={this.props.hasBasicApps} apps={data} />;
          }}
        </AppsFetcher>
      </AdminOnly>
    );
  }
}
