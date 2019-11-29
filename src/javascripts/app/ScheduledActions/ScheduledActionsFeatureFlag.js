import React from 'react';
import PropTypes from 'prop-types';
import BooleanSpaceFeature from 'utils/ProductCatalog/BooleanSpaceFeature';
import * as FeatureFlagKey from 'featureFlags';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { trackAlphaEligibilityToIntercom } from './Analytics/ScheduledActionsAnalytics';

export function getJobsFeatureVariation({ spaceId }) {
  return getSpaceFeature(spaceId, FeatureFlagKey.SCHEDULED_PUBLISHING);
}

/**
 * The facade for jobs feature flag. Tracks feature eligibility to intercom.
 * @param {Function} children
 */
export default function ScheduledActionsFeatureFlag({ children }) {
  return (
    <BooleanSpaceFeature spaceFeatureKey={FeatureFlagKey.SCHEDULED_PUBLISHING}>
      {({ currentVariation }) => {
        if (currentVariation) {
          trackAlphaEligibilityToIntercom();
        }
        return children({ currentVariation });
      }}
    </BooleanSpaceFeature>
  );
}

ScheduledActionsFeatureFlag.propTypes = {
  children: PropTypes.func.isRequired
};
