import React from 'react';
import * as Navigator from 'states/Navigator';
import * as logger from 'services/logger';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { fetchContentfulApps, getAppsRepo } from 'features/apps-core';
import {
  isCurrentEnvironmentMaster,
  isMasterEnvironment,
} from 'core/services/SpaceEnvContext/utils';
import ContentfulLogo from 'svg/logo-label.svg';

const getAppInstallRouteProps = ({
  app,
  environmentId,
  isMasterEnvironment,
}: {
  app: NavigationSwitcherAppProps;
  environmentId: string;
  isMasterEnvironment: boolean;
}) => {
  return {
    path: isMasterEnvironment ? 'spaces.detail.apps.list' : 'spaces.detail.environment.apps.list',
    params: { environmentId, app: app.slug || app.id },
  };
};

export interface NavigationSwitcherAppProps {
  id?: string;
  definitionId?: string;
  icon: React.ReactNode;
  title: string;
  tagLine?: string;
  description: string;
  targetUrl?: string;
  featureFlagName?: string;
  href: string;
  installRouteProps?: ReturnType<typeof getAppInstallRouteProps>;
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

const usePurchasedApps = (organizationId: string | undefined) => {
  const [purchasedApps, setPurchasedApps] = React.useState<Record<
    'compose' | 'launch',
    boolean
  > | null>(null);

  React.useEffect(() => {
    if (!organizationId) return;

    Promise.all<boolean>([
      getOrgFeature(organizationId, 'compose_app', false),
      getOrgFeature(organizationId, 'launch_app', false),
    ])
      .catch((error) => {
        logger.logError('Failed to fetch contentful apps product catalog flags.', { error });
        return [false, false];
      })
      .then(([compose, launch]) => {
        setPurchasedApps({ compose, launch });
      });
  }, [organizationId]);

  return purchasedApps;
};

export const useAppsList = () => {
  const [enabledApps, setEnabledApps] = React.useState<NavigationSwitcherAppProps[]>([webApp]);
  const [isLoading, setIsLoading] = React.useState(true);
  const spaceEnv = useSpaceEnvContext();

  const {
    currentOrganizationId: organizationId,
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentSpace,
  } = spaceEnv;

  const envIsMaster = isMasterEnvironment(spaceEnv.currentEnvironment);
  const purchasedApps = usePurchasedApps(organizationId);

  React.useEffect(() => {
    if (!spaceId || !organizationId || !environmentId) return;

    const spaceEnvPath = `spaces/${spaceId}${
      isCurrentEnvironmentMaster(currentSpace) ? '' : `/environments/${environmentId}`
    }`;

    (async () => {
      if (!purchasedApps) return;

      const ldContext = { organizationId, spaceId, environmentId };

      // get list of marketplace contentful apps
      const [contentfulApps, installedApps] = await Promise.all([
        fetchContentfulApps() as Promise<NavigationSwitcherAppProps[]>,
        getAppsRepo().getOnlyInstalledApps(),
      ]);
      const installedAppIds = new Set(installedApps.map((app: { id: string }) => app.id));

      // filter based on both PD and LD feature flags
      const enabledApps = (
        await Promise.all(
          contentfulApps.map(
            async (app): Promise<NavigationSwitcherAppProps | null> => {
              if (!purchasedApps[app.id!]) return null;

              const featureFlagId = FLAGS[app.featureFlagName];
              const appFlagIsEnabled = featureFlagId
                ? await getVariation(featureFlagId, ldContext)
                : true;
              const isInstalled = installedAppIds.has(app.id);
              const installRouteProps = getAppInstallRouteProps({
                app,
                environmentId,
                isMasterEnvironment: envIsMaster,
              });

              return appFlagIsEnabled
                ? {
                    ...app,
                    description: app.tagLine || '',
                    installRouteProps,
                    href: isInstalled
                      ? `${app.targetUrl}/${spaceEnvPath}`
                      : Navigator.href(installRouteProps),
                    active: false,
                    isInstalled,
                  }
                : null;
            }
          )
        )
      ).filter((app): app is NonNullable<typeof app> => app !== null);

      setEnabledApps([webApp, ...enabledApps]);
      setIsLoading(false);
    })();

    return () => {
      setEnabledApps([]);
      setIsLoading(true);
    };
  }, [organizationId, spaceId, environmentId, currentSpace, envIsMaster, purchasedApps]);

  return { appsList: enabledApps, isLoading };
};
