import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { getModule } from 'core/NgRegistry';

export async function getReleasesFeatureVariation() {
  try {
    const spaceContext = getModule('spaceContext');
    const flag = await getVariation(FLAGS.ADD_TO_RELEASE, {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      organizationId: spaceContext.getData(['organization', 'sys', 'id']),
    });

    return flag;
  } catch (_e) {
    return false;
  }
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
