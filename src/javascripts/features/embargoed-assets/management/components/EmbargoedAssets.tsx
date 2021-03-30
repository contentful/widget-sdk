import { Notification, Paragraph } from '@contentful/forma-36-react-components';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import React, { useEffect, useState } from 'react';
import { EnabledLevel, Level, LEVEL } from '../constants';
import { styles } from '../EmbargoedAssets.styles';
import { embargoedAssets } from '../services/embargoedAssetsService';
import { DisabledFeature } from './DisabledFeature';
import { EnabledFeature } from './EnabledFeature';
import { LoadingFeature } from './LoadingFeature';

function notificationForLevel(level: Level) {
  switch (level) {
    case LEVEL.MIGRATING:
      return (
        <>
          <Paragraph className={styles.bolder}>Preparation mode activated</Paragraph>
          <Paragraph>Use this mode to set up your assets to be protected.</Paragraph>
        </>
      );
    case LEVEL.UNPUBLISHED:
      return (
        <>
          <Paragraph className={styles.bolder}>Unpublished assets protected</Paragraph>
          <Paragraph>
            Unpublished assets are protected within 48 hours, and published assets are publicly
            accessible.
          </Paragraph>
        </>
      );
    case LEVEL.ALL:
      return (
        <>
          <Paragraph className={styles.bolder}>All assets protected</Paragraph>
          <Paragraph>All assets will be protected within 48 hours.</Paragraph>
        </>
      );

    case LEVEL.DISABLED:
      return (
        <>
          <Paragraph className={styles.bolder}>Embargoed assets turned off</Paragraph>
          <Paragraph>All assets are now publicly accessible.</Paragraph>
        </>
      );
    default:
      return '';
  }
}

export function EmbargoedAssets() {
  const { currentSpaceId } = useSpaceEnvContext();
  const [currentLevel, setCurrentLevel] = useState<Level>(LEVEL.DISABLED);
  const [isFetching, setIsFetching] = useState(true);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchSettings() {
      try {
        const settings = await embargoedAssets(currentSpaceId).getCurrentLevel();

        if (isMounted) {
          setIsFetching(false);
          setCurrentLevel(settings.level || LEVEL.DISABLED);
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

  const handleLevelChange = (newLevel: Level | EnabledLevel) => {
    return embargoedAssets(currentSpaceId)
      .setCurrentLevel(newLevel)
      .then(
        ({ level }) => {
          setCurrentLevel(level);
          Notification.success(notificationForLevel(level) as string);
        },
        () => {
          Notification.error('Error saving settings');
        }
      );
  };

  if (currentLevel === LEVEL.DISABLED) {
    return <DisabledFeature setCurrentLevel={handleLevelChange} />;
  }

  return <EnabledFeature currentLevel={currentLevel} setCurrentLevel={handleLevelChange} />;
}
