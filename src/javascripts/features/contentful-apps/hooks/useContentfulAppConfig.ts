import { useState, useEffect } from 'react';
import { getOrgFeature, FEATURES } from 'data/CMA/ProductCatalog';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { getAppsRepo } from 'features/apps-core';

/**
 * Add new app config here and use it like
 * `useUseContentfulAppsConfig({appId: 'your-app-id', ...})`
 */
const APPS_CONFIG = {
  compose: {
    id: 'compose',
    featureFlag: FLAGS.COMPOSE_APP_LISTING_EAP,
    catalogFlag: FEATURES.PC_ORG_COMPOSE_APP,
  },
  launch: {
    id: 'launch',
    featureFlag: FLAGS.COMPOSE_APP_LISTING_EAP,
    catalogFlag: FEATURES.PC_ORG_LAUNCH_APP,
  },
};

const checkInstalledApp = async (appId?: string) => {
  const appsRepo = getAppsRepo();
  const installedApps = await appsRepo.getOnlyInstalledApps();
  const isAppInstalled = installedApps.some((app) => app.id === appId);
  return isAppInstalled;
};

export interface AppState {
  isInstalled?: boolean;
  isEnabled?: boolean;
  isPurchased?: boolean;
}

export interface UseContentfulAppsConfig {
  appId: keyof typeof APPS_CONFIG;
  organizationId?: string;
  spaceId?: string;
  environmentId?: string;
}

/**
 * Returns app states isEnabled, isPurchased, etc...
 */
export const useContentfulAppsConfig = ({
  appId,
  organizationId,
  spaceId,
  environmentId,
}: UseContentfulAppsConfig): AppState => {
  const [appState, setAppState] = useState<AppState>({});

  useEffect(() => {
    let mounted = true;
    const featureFlagOptions = {
      organizationId,
      spaceId,
      environmentId,
    };

    const fetchData = async () => {
      const [isPurchased, isEnabled, isInstalled] = await Promise.all([
        getOrgFeature(organizationId, APPS_CONFIG[appId].catalogFlag, false),
        getVariation(APPS_CONFIG[appId].featureFlag, featureFlagOptions as any),
        checkInstalledApp(appId),
      ]);
      if (mounted) {
        setAppState({
          isPurchased,
          isEnabled,
          isInstalled,
        });
      }
    };
    fetchData();

    return () => {
      mounted = false;
    };
  }, [appId, organizationId, spaceId, environmentId]);

  return appState;
};
