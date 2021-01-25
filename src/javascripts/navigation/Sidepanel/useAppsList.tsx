import React from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { fetchContentfulApps, getAppsRepo } from 'features/apps-core';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import ContentfulLogo from 'svg/logo-label.svg';

export interface NavigationSwitcherAppProps {
  id?: string;
  definitionId?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  targetUrl?: string;
  featureFlagName?: string;
  href: string;
  active: boolean;
  isInstalled: boolean;
  slug?: string;
}

const webApp: NavigationSwitcherAppProps = {
  icon: <ContentfulLogo width="32" />,
  href: '#',
  active: true,
  title: 'Web app',
  description: 'The classic Contentful experience',
  isInstalled: true,
};

export const useAppsList = () => {
  const [enabledApps, setEnabledApps] = React.useState<NavigationSwitcherAppProps[]>([webApp]);
  const spaceEnv = useSpaceEnvContext();

  const {
    currentOrganizationId: organizationId,
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentSpace,
  } = spaceEnv;

  React.useEffect(() => {
    if (!spaceId || !organizationId || !environmentId) return;

    const spaceEnvPath = `spaces/${spaceId}${
      isCurrentEnvironmentMaster(currentSpace) ? '' : `/environments/${environmentId}`
    }`;

    (async () => {
      const ldContext = { organizationId, spaceId, environmentId };

      // get list of marketplace contentful apps and filter based on feature flags
      const [contentfulApps, installedApps] = await Promise.all([
        fetchContentfulApps() as Promise<NavigationSwitcherAppProps[]>,
        getAppsRepo().getOnlyInstalledApps(),
      ]);
      const installedAppIds = new Set(installedApps.map((app: { id: string }) => app.id));

      const enabledApps = (
        await Promise.all(
          contentfulApps.map(async (app) => {
            const featureFlagId = FLAGS[app.featureFlagName];
            const appFlagIsEnabled = featureFlagId
              ? await getVariation(featureFlagId, ldContext)
              : true;
            const isInstalled = installedAppIds.has(app.id);

            return appFlagIsEnabled
              ? {
                  ...app,
                  href: isInstalled
                    ? `${app.targetUrl}/${spaceEnvPath}`
                    : `/${spaceEnvPath}/apps?app=${app.slug || app.id}`,
                  active: false,
                  isInstalled,
                }
              : null;
          })
        )
      ).filter((app): app is NavigationSwitcherAppProps => app !== null);

      setEnabledApps([webApp, ...enabledApps]);
    })();

    return () => setEnabledApps([]);
  }, [organizationId, spaceId, environmentId, currentSpace]);

  return enabledApps;
};
