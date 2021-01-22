import React from 'react';
import TheLocaleStore from 'services/localeStore';
import StateRedirect from 'app/common/StateRedirect';
import { useFeatureFlagAddToRelease } from '../ReleasesFeatureFlag';
import ReleaseDetailPageContainer from '../ReleaseDetail/ReleaseDetailPageContainer';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';

const ReleaseDetailRoute = () => {
  const { currentEnvironment } = useSpaceEnvContext();
  const pathname = window.location.pathname.split('/');
  const releasesPathnameIndex = pathname.findIndex((path) => path === 'releases');
  const releaseId = pathname[releasesPathnameIndex + 1];
  const isMaster = isMasterEnvironment(currentEnvironment);
  const defaultLocale = TheLocaleStore.getDefaultLocale();
  const { addToReleaseEnabled, isAddToReleaseLoading } = useFeatureFlagAddToRelease();

  if (isAddToReleaseLoading) {
    return null;
  }
  if (addToReleaseEnabled === true) {
    return (
      <ReleaseDetailPageContainer
        releaseId={releaseId}
        defaultLocale={defaultLocale}
        isMasterEnvironment={isMaster}
      />
    );
  } else {
    return <StateRedirect path="spaces.detail.entries.list" />;
  }
};

export default ReleaseDetailRoute;
