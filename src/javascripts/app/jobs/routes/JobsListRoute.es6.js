import React, { Component } from 'react';
import PropTypes from 'prop-types';
import JobsListPage from '../list/JobsListPage.es6';

import StateRedirect from 'app/common/StateRedirect.es6';

import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';

export default class JobsListRoute extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    contentTypes: PropTypes.array.isRequired,
    defaultLocale: PropTypes.object
  };

  render() {
    return (
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
        {({ currentVariation }) => {
          if (currentVariation === true) {
            return (
              <JobsListPage
                spaceId={this.props.spaceId}
                environmentId={this.props.environmentId}
                defaultLocale={this.props.defaultLocale}
                contentTypes={this.props.contentTypes}
              />
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
