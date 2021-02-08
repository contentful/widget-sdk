import React from 'react';
import * as Navigator from 'states/Navigator';
import * as logger from 'services/logger';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FEATURES, getOrgFeature } from 'data/CMA/ProductCatalog';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { fetchContentfulApps, getAppsRepo } from 'features/apps-core';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { AppsListProps } from '@contentful/experience-components';
import { getContentfulAppUrl } from 'features/apps';

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
  type: 'web-app' | 'launch' | 'compose';
  tagLine?: string;
  featureFlagName?: string;
  href: string;
  installRouteProps?: ReturnType<typeof getAppInstallRouteProps>;
  active: boolean;
  isInstalled: boolean;
  slug?: string;
}

const webApp: NavigationSwitcherAppProps = {
  type: 'web-app' as const,
  href: '#',
  active: true,
  isInstalled: true,
};

const usePurchasedApps = (organizationId: string | undefined) => {
  const [purchasedApps, setPurchasedApps] = React.useState<Record<
    'compose' | 'launch',
    boolean
  > | null>(null);

  React.useEffect(() => {
    if (!organizationId) {
      setPurchasedApps({ compose: false, launch: false });
      return;
    }

    Promise.all<boolean>([
      getOrgFeature(organizationId, FEATURES.PC_ORG_COMPOSE_APP, false),
      getOrgFeature(organizationId, FEATURES.PC_ORG_LAUNCH_APP, false),
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
  } = spaceEnv;

  const envIsMaster = isMasterEnvironment(spaceEnv.currentEnvironment);
  const purchasedApps = usePurchasedApps(organizationId);

  React.useEffect(() => {
    if (!spaceId || !organizationId || !environmentId) {
      setIsLoading(false);
      return;
    }

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

              const spaceInformation = {
                spaceId: spaceId!,
                spaceName: '', // not necessary downstream
                envMeta: { environmentId, isMasterEnvironment: envIsMaster },
              };
              const appUrl = getContentfulAppUrl(app.id!, spaceInformation);

              return appFlagIsEnabled
                ? {
                    ...app,
                    type: app.id as AppsListProps['type'],
                    installRouteProps,
                    href: isInstalled && appUrl ? appUrl : Navigator.href(installRouteProps),
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
  }, [organizationId, spaceId, environmentId, envIsMaster, purchasedApps]);

  return { appsList: enabledApps, isLoading };
};
