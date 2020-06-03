import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as FeatureFlagKey from 'featureFlags';
import { getCurrentVariation } from 'utils/LaunchDarkly';

export function getReleasesFeatureVariation() {
  return getCurrentVariation(FeatureFlagKey.ADD_TO_RELEASE);
}

/**
 * The facade for releases feature flag.
 * @param {Function} children
 */
export default function ReleasesFeatureFlag({ children }) {
  const [currentVariation, setCurrentVariation] = useState(undefined);

  useEffect(() => {
    async function fetchFlag() {
      const flag = await getReleasesFeatureVariation();
      setCurrentVariation(flag);
    }

    fetchFlag();
  }, []);

  return <>{children({ currentVariation })}</>;
}

ReleasesFeatureFlag.propTypes = {
  children: PropTypes.func.isRequired,
};
