import React from 'react';
import StateRedirect from 'app/common/StateRedirect';
import ReleaseDetailPageContainer from '../ReleaseDetail/ReleaseDetailPageContainer';
import { useContentfulAppsConfig } from 'features/contentful-apps';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const ReleaseDetailRoute = () => {
  const pathname = window.location.pathname.split('/');
  const releasesPathnameIndex = pathname.findIndex((path) => path === 'releases');
  const releaseId = pathname[releasesPathnameIndex + 1];

  const { currentOrganizationId, currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();

  const appConfig = useContentfulAppsConfig({
    appId: 'launch',
    organizationId: currentOrganizationId,
    spaceId: currentSpaceId,
    environmentId: currentEnvironmentId, // should we count alias in here?
  });

  if (appConfig.isFetching) {
    return null;
  }

  if (appConfig.isPurchased && appConfig.isInstalled) {
    return <ReleaseDetailPageContainer releaseId={releaseId} />;
  } else {
    return <StateRedirect path="spaces.detail.entries.list" />;
  }
};

export default ReleaseDetailRoute;
