import React from 'react';
import * as Navigator from 'states/Navigator';
import { captureError } from 'core/monitoring';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { OrganizationFeatures, getOrgFeature } from 'data/CMA/ProductCatalog';
import { getVariation, FLAGS } from 'core/feature-flags';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { AppsListProps } from '@contentful/experience-components';
import { useContentfulApps, useInstalledApps } from 'features/apps-core';
import { MarketplaceApp } from 'features/apps-core';
import { getContentfulAppUrl } from 'features/apps';
import { router } from 'core/react-routing';

export interface NavigationSwitcherAppProps {
  id?: string;
  definitionId?: string;
  type: 'web-app' | 'launch' | 'compose';
  tagLine?: string;
  featureFlagName?: string;
  href: string;
  navigate: () => void;
  active: boolean;
  isInstalled: boolean;
  slug?: string;
}

const webApp: NavigationSwitcherAppProps = {
  type: 'web-app' as const,
  href: '#',
  active: true,
  isInstalled: true,
  navigate: () => {
    Navigator.go({ path: 'home' });
  },
};

const usePurchasedApps = (organizationId: string | undefined) => {
  const [purchasedApps, setPurchasedApps] =
    React.useState<Record<'compose' | 'launch', boolean> | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    if (!organizationId) {
      setPurchasedApps({ compose: false, launch: false });
      return;
    }

    Promise.all<boolean>([
      getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_COMPOSE_APP, false),
      getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_LAUNCH_APP, false),
    ])
      .catch((error) => {
        captureError(error);
        return [false, false];
      })
      .then(([compose, launch]) => {
        if (isMounted) {
          setPurchasedApps({ compose, launch });
        }
      });

    return () => {
      isMounted = false;
    };
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
  // TODO: handle errors
  const purchasedApps = usePurchasedApps(organizationId);
  const [contentfulApps] = useContentfulApps() as [
    (NavigationSwitcherAppProps & MarketplaceApp)[] | undefined,
    unknown
  ];
  const [installedApps] = useInstalledApps();

  React.useEffect(() => {
    let isMounted = true;

    if ((!spaceId || !organizationId || !environmentId) && isMounted) {
      setIsLoading(false);
      return;
    }

    (async () => {
      if (!purchasedApps || !contentfulApps) return;

      const ldContext = { organizationId, spaceId, environmentId };

      const installedAppIds = new Set(installedApps?.map((app: { id: string }) => app.id));

      // filter based on both PD and LD feature flags
      const enabledApps = (
        await Promise.all(
          contentfulApps.map(async (app): Promise<NavigationSwitcherAppProps | null> => {
            if (!purchasedApps[app.id]) return null;

            const featureFlagId = app.featureFlagName ? FLAGS[app.featureFlagName] : null;
            const appFlagIsEnabled = featureFlagId
              ? await getVariation(featureFlagId, ldContext)
              : true;
            const isInstalled = installedAppIds.has(app.id);

            const installHref = router.href({
              path: 'apps.list',
              app: app.slug || app.id,
              spaceId,
              environmentId,
            });

            const installNavigate = () => {
              router.navigate({
                path: 'apps.list',
                app: app.slug || app.id,
                spaceId,
                environmentId,
              });
            };

            const spaceInformation = {
              spaceId: spaceId as string,
              spaceName: '', // not necessary downstream
              envMeta: { environmentId, isMasterEnvironment: envIsMaster },
            };

            const appUrl = getContentfulAppUrl(app.id, spaceInformation);

            // Remove long description for showing in AppSwitcher
            delete app.description;

            return appFlagIsEnabled
              ? {
                  ...app,
                  type: app.id as AppsListProps['type'],
                  href: isInstalled && appUrl ? appUrl : installHref,
                  navigate: installNavigate,
                  active: false,
                  isInstalled,
                }
              : null;
          })
        )
      ).filter((app): app is NonNullable<typeof app> => app !== null);

      if (isMounted) {
        setEnabledApps([webApp, ...enabledApps]);
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      setEnabledApps([]);
      setIsLoading(true);
    };
  }, [
    organizationId,
    spaceId,
    environmentId,
    envIsMaster,
    purchasedApps,
    contentfulApps,
    installedApps,
  ]);

  return { appsList: enabledApps, isLoading };
};
