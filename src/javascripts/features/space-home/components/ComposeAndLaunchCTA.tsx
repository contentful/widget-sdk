import React, { ReactElement } from 'react';
import { WidgetContainer } from '../widgets/WidgetContainer';
import { ContentfulAppTile, SpaceInformation, canUserManageApps } from 'features/apps';
import LaunchAndComposeIcon from 'svg/illustrations/launch-compose-screenshot.svg';
import { go } from 'states/Navigator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { useContentfulAppsConfig } from 'features/contentful-apps';

export const ComposeAndLaunchCTA = (): ReactElement => {
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
    <>
      {compose.isEnabled &&
        launch.isEnabled &&
        compose.isPurchased &&
        launch.isPurchased &&
        !compose.isInstalled &&
        !launch.isInstalled && (
          <WidgetContainer.Row order>
            <WidgetContainer.Col>
              <ContentfulAppTile
                slug="app"
                title="Install Compose + Launch to enhance your content creation and release"
                text="Compose + Launch are available to your organization. Install them to grant content teams more power and independence."
                image={<LaunchAndComposeIcon />}
                canManage={canUserManageApps()}
                organizationId={currentOrganizationId}
                spaceInformation={spaceInfo as SpaceInformation}
                installAction={() => {
                  go({ path: ['spaces', 'detail', 'apps', 'list'] });
                }}
                isInstalled={false}
                isPurchased
                isFlipped
                isScreenshot
              />
            </WidgetContainer.Col>
          </WidgetContainer.Row>
        )}

      {compose.isEnabled && launch.isEnabled && !compose.isPurchased && !launch.isPurchased && (
        <WidgetContainer.Row order>
          <WidgetContainer.Col>
            <ContentfulAppTile
              slug="app"
              title="Compose + Launch will give editors more power and independence"
              text="Compose + Launch, our new Contentful Apps, grant content teams more control over the way you create and publish."
              image={<LaunchAndComposeIcon />}
              canManage={canUserManageApps()}
              organizationId={currentOrganizationId}
              spaceInformation={spaceInfo as SpaceInformation}
              isInstalled={false}
              isPurchased={false}
              isFlipped
              isScreenshot
            />
          </WidgetContainer.Col>
        </WidgetContainer.Row>
      )}
    </>
  );
};
