import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import StateRedirect from 'app/common/StateRedirect';
import { ReleaseDetailsPage } from './ReleaseDetailsPage';
import { useContentfulAppsConfig } from 'features/contentful-apps';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { appsMarketingUrl } from 'Config';

const ReleaseDetailsRoute = () => {
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
    return <ReleaseDetailsPage releaseId={releaseId} />;
  } else {
    Notification.warning(
      "The releases EAP has ended, but don't worry because you can now use releases in Launch",
      {
        cta: {
          label: 'Learn more',
          textLinkProps: {
            target: '_blank',
            rel: 'noopener noreferrer',
            href: appsMarketingUrl,
          },
        },
      }
    );
    return <StateRedirect path="spaces.detail.entries.list" />;
  }
};

export { ReleaseDetailsRoute };
