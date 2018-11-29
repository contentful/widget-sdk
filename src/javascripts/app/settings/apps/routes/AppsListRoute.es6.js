import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import AppsListPage from '../list/AppsListPage.es6';
import createAppsClient from '../AppsClient.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';

const AppsFetcher = createFetcherComponent(({ spaceId }) => {
  return createAppsClient(spaceId).getAll();
});

export default class AppsListRoute extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <AppsFetcher spaceId={this.props.spaceId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading apps..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }
            return <AppsListPage apps={data} />;
          }}
        </AppsFetcher>
      </AdminOnly>
    );
  }
}
