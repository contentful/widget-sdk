import React from 'react';

import { Notification } from '@contentful/forma-36-react-components';
import StateRedirect from 'app/common/StateRedirect';
import { ReleasesListPage } from './ReleasesListPage';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { useContentfulAppsConfig } from 'features/contentful-apps';
import { appsMarketingUrl } from 'Config';

const ReleasesListRoute = () => {
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
    return <ReleasesListPage />;
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

export { ReleasesListRoute };
