import React, { ReactElement } from 'react';
import { WidgetContainer } from '../widgets/WidgetContainer';
import { ContentfulAppTile, SpaceInformation, canUserManageApps } from 'features/apps';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { AppLogos } from '@contentful/experience-components';
import { useContentfulAppsConfig } from 'features/contentful-apps';

export const ContentfulAppsCTA = (): ReactElement => {
  const {
    currentSpaceId,
    currentSpaceName,
    currentEnvironmentId,
    currentOrganizationId,
  } = useSpaceEnvContext();

  const config = {
    organizationId: currentOrganizationId,
    spaceId: currentSpaceId,
    environmentId: currentEnvironmentId,
  };

  const compose = useContentfulAppsConfig({
    appId: 'compose',
    ...config,
  });

  const launch = useContentfulAppsConfig({
    appId: 'launch',
    ...config,
  });

  const spaceInfo = {
    spaceId: currentSpaceId,
    spaceName: currentSpaceName,
    envMeta: {
      environmentId: currentEnvironmentId,
      isMasterEnvironment: currentEnvironmentId === 'master',
    },
  };

  return (
    <WidgetContainer.Row order>
      {compose.isEnabled && compose.isInstalled && (
        <WidgetContainer.Col>
          <ContentfulAppTile
            slug="compose"
            title="Compose"
            text="Easily create and edit content at scale in a completely new way"
            image={<AppLogos.ComposeLogo />}
            canManage={canUserManageApps()}
            organizationId={currentOrganizationId}
            spaceInformation={spaceInfo as SpaceInformation}
            isInstalled={compose.isInstalled}
            isPurchased={compose.isPurchased}
            isFlipped
          />
        </WidgetContainer.Col>
      )}
      {launch.isEnabled && launch.isInstalled && (
        <WidgetContainer.Col>
          <ContentfulAppTile
            slug="launch"
            title="Launch"
            text="Plan, release and measure content at scale"
            image={<AppLogos.LaunchLogo />}
            canManage={canUserManageApps()}
            organizationId={currentOrganizationId}
            spaceInformation={spaceInfo as SpaceInformation}
            isInstalled={launch.isInstalled}
            isPurchased={launch.isPurchased}
            isFlipped
          />
        </WidgetContainer.Col>
      )}
    </WidgetContainer.Row>
  );
};
