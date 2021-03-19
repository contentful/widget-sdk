import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import React, { useEffect, useState } from 'react';
import { LEVEL } from '../constants';
import { embargoedAssets } from '../services/embargoedAssetsService';
import { DisabledFeature } from './DisabledFeature';
import { EnabledFeature } from './EnabledFeature';
import { LoadingFeature } from './LoadingFeature';

export function EmbargoedAssets() {
  const { currentSpaceId } = useSpaceEnvContext();
  const [currentLevel, setCurrentLevel] = useState<LEVEL>(LEVEL.DISABLED);
  const [isFetching, setIsFetching] = useState(true);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchSettings() {
      try {
        const settings = await embargoedAssets(currentSpaceId).getCurrentLevel();

        if (isMounted) {
          setIsFetching(false);
          setCurrentLevel(settings.level);
        }
      } catch (e) {
        if (isMounted) {
          setIsFetching(false);
          setIsDenied(true);
        }
      }
    }

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [currentSpaceId]);

  if (isFetching) {
    return <LoadingFeature />;
  }

  if (isDenied) {
    return <DisabledFeature />;
  }

  const handleLevelChange = (newLevel: LEVEL | 'enabled') => {
    return embargoedAssets(currentSpaceId)
      .setCurrentLevel(newLevel)
      .then(({ level }) => setCurrentLevel(level));
  };

  if (!currentLevel) {
    return <DisabledFeature setCurrentLevel={handleLevelChange} />;
  }

  return <EnabledFeature currentLevel={currentLevel} setCurrentLevel={handleLevelChange} />;
}
