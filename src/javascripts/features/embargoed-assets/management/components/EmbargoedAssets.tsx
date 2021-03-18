import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import React, { useEffect, useState } from 'react';
import { LEVEL } from '../constants';
import { embargoedAssets } from '../services/embargoedAssetsService';
import { DisabledFeature } from './DisabledFeature';
import { EnabledFeature } from './EnabledFeature';

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
    // @todo replace with skeleton
    return <>loading</>;
  }

  if (isDenied) {
    return <DisabledFeature />;
  }

  if (!currentLevel) {
    return <DisabledFeature setCurrentLevel={setCurrentLevel} />;
  }

  return <EnabledFeature currentLevel={currentLevel} setCurrentLevel={setCurrentLevel} />;
}
