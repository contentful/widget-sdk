import React from 'react';
import PropTypes from 'prop-types';

import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag';
import * as FeatureFlagKey from 'featureFlags';
import { trackAlphaEligibilityToIntercom } from './Analytics/JobsAnalytics';

/**
 * The facade for jobs feature flag. Tracks feature eligibility to intercom.
 * @param {Function} children
 */
export default function JobsFeatureFlag({ children }) {
  return (
    <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
      {({ currentVariation }) => {
        if (currentVariation) {
          trackAlphaEligibilityToIntercom();
        }
        return children({ currentVariation });
      }}
    </BooleanFeatureFlag>
  );
}

JobsFeatureFlag.propTypes = {
  children: PropTypes.func.isRequired
};
