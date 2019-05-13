import React, { Component } from 'react';
import PropTypes from 'prop-types';
import JobsListPage, { JobsListPageLoading } from '../list/JobsListPage.es6';

import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import { scheduledJobsMock } from '../helpers/jobs_mocks.es6';

const JobsFetcher = createFetcherComponent(async ({ _spaceId }) => {
  return Promise.resolve(scheduledJobsMock);
});

export default class JobsListRoute extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired
  };

  render() {
    return (
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
        {({ currentVariation }) => {
          if (currentVariation === true) {
            return (
              <JobsFetcher spaceId={this.props.spaceId}>
                {({ isLoading, isError, data }) => {
                  if (isLoading) {
                    return <JobsListPageLoading />;
                  }
                  if (isError) {
                    return <StateRedirect to="spaces.detail.entries.list" />;
                  }

                  return <JobsListPage jobs={data} />;
                }}
              </JobsFetcher>
            );
          } else if (currentVariation === false) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          } else {
            return null;
          }
        }}
      </BooleanFeatureFlag>
    );
  }
}
