import React, { ReactNode } from 'react';
import BooleanSpaceFeature from 'utils/ProductCatalog/BooleanSpaceFeature';
import { getSpaceFeature, SpaceFeatures } from 'data/CMA/ProductCatalog';
import { trackAlphaEligibilityToIntercom } from '../../app/ScheduledActions/Analytics/ScheduledActionsAnalytics';

const getScheduledActionsFeatureVariation = ({ spaceId }: { spaceId: string }) => {
  return getSpaceFeature(spaceId, SpaceFeatures.SCHEDULED_PUBLISHING);
};

/**
 * The facade for jobs feature flag. Tracks feature eligibility to intercom.
 * @param {Function} children
 */
const ScheduledActionsFeatureFlag = ({
  children,
}: {
  children: ({ currentVariation: boolean }) => ReactNode;
}) => {
  return (
    <BooleanSpaceFeature spaceFeatureKey={SpaceFeatures.SCHEDULED_PUBLISHING}>
      {({ currentVariation }) => {
        if (currentVariation) {
          trackAlphaEligibilityToIntercom();
        }
        return children({ currentVariation });
      }}
    </BooleanSpaceFeature>
  );
};

export { getScheduledActionsFeatureVariation, ScheduledActionsFeatureFlag };
