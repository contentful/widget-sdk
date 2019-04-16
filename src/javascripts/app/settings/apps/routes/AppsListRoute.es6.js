import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import AppsListPage, { AppsListPageLoading } from '../list/AppsListPage.es6';
import createAppsClient from '../AppsClient.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';

async function getEnabledApps(hasAppFeature, apps) {
  const features = await Promise.all(apps.map(async app => [await hasAppFeature(app.id), app.id]));

  return features.filter(([enabled]) => enabled).map(([_, id]) => id);
}

const AppsFetcher = createFetcherComponent(async ({ hasAppFeature, spaceId }) => {
  const apps = await createAppsClient(spaceId).getAll();
  const enabled = await getEnabledApps(hasAppFeature, apps);

  return apps.reduce(
    (acc, app) => {
      const addTo = group => ({ ...acc, [group]: acc[group].concat([app]) });

      if (!enabled.includes(app.id)) {
        return addTo('unavailable');
      } else if (app.installed) {
        return addTo('installed');
      } else {
        return addTo('available');
      }
    },
    { installed: [], available: [], unavailable: [] }
  );
});

export default class AppsListRoute extends Component {
  static propTypes = {
    hasAppFeature: PropTypes.func.isRequired,
    spaceId: PropTypes.string.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <AppsFetcher hasAppFeature={this.props.hasAppFeature} spaceId={this.props.spaceId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <AppsListPageLoading />;
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
