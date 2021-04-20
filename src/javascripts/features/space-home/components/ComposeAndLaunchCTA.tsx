import React, { ReactElement } from 'react';
import { WidgetContainer } from '../widgets/WidgetContainer';
import { ContentfulAppTile, SpaceInformation, canUserManageApps } from 'features/apps';
import LaunchAndComposeIcon from 'svg/illustrations/launch-compose-screenshot.svg';
import { go } from 'states/Navigator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { useContentfulAppsConfig } from 'features/contentful-apps';
import { useAppsTrial } from 'features/trials';

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

  const canManage = canUserManageApps();

  const { canStartTrial: isTrialAvailable } = useAppsTrial(currentOrganizationId);

  const appsEnabled = compose.isEnabled && launch.isEnabled;
  const appsPurchased = compose.isPurchased && launch.isPurchased;
  const appsInstalled = compose.isInstalled && launch.isInstalled;

  const showInstallAction = appsEnabled && appsPurchased && !appsInstalled;
  const showBuyOrTrialAction =
    !showInstallAction && (compose.isTrialActive || (appsEnabled && !appsPurchased));

  const PROMO_TEXT = {
    trial: {
      title: isTrialAvailable
        ? 'Compose + Launch free trial'
        : 'Compose + Launch: powerful tools to deliver content faster',
      text: `Compose and Launch give your content teams powerful new tools that allow them to work faster and collaborate more effectively. None of your content will be affected, and no payment details are needed to start.
        ${!canManage ? 'To try Compose + Launch, contact your Contentful administrator.' : ''}
      `,
    },
    install: {
      title: 'Install Compose + Launch: powerful tools to deliver content faster',
      text:
        'Compose + Launch are included with your plan. Give your content teams powerful new tools that allow them to work faster and collaborate more effectively.',
    },
  };

  return (
    <>
      {showInstallAction && (
        <WidgetContainer.Row order>
          <WidgetContainer.Col>
            <ContentfulAppTile
              slug="app"
              {...PROMO_TEXT.install}
              image={<LaunchAndComposeIcon />}
              canManage={canManage}
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

      {showBuyOrTrialAction && (
        <WidgetContainer.Row order>
          <WidgetContainer.Col>
            <ContentfulAppTile
              from="space-home-combined"
              slug="app"
              {...PROMO_TEXT.trial}
              image={<LaunchAndComposeIcon />}
              canManage={canUserManageApps()}
              organizationId={currentOrganizationId}
              spaceInformation={spaceInfo as SpaceInformation}
              isInstalled={false}
              isPurchased={false}
              isTrialAvailable={isTrialAvailable}
              isFlipped
              isScreenshot
            />
          </WidgetContainer.Col>
        </WidgetContainer.Row>
      )}
    </>
  );
};
