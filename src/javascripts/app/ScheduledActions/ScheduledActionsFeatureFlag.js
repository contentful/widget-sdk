import React from 'react';
import PropTypes from 'prop-types';
import BooleanSpaceFeature from 'utils/ProductCatalog/BooleanSpaceFeature';
import { getSpaceFeature, FEATURES } from 'data/CMA/ProductCatalog';
import { trackAlphaEligibilityToIntercom } from './Analytics/ScheduledActionsAnalytics';

export function getScheduledActionsFeatureVariation({ spaceId }) {
  return getSpaceFeature(spaceId, FEATURES.SCHEDULED_PUBLISHING);
}

/**
 * The facade for jobs feature flag. Tracks feature eligibility to intercom.
 * @param {Function} children
 */
export default function ScheduledActionsFeatureFlag({ children }) {
  return (
    <BooleanSpaceFeature spaceFeatureKey={FEATURES.SCHEDULED_PUBLISHING}>
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
  children: PropTypes.func.isRequired,
};
