import { useState, useEffect } from 'react';
import { getOrgFeature, FEATURES } from 'data/CMA/ProductCatalog';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { getAppsRepo } from 'features/apps-core';
import { canStartAppTrial, isActiveAppTrial, AppTrialRepo } from 'features/trials';

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

const fallBackClose = (promise: Promise<any>) => promise.catch(() => false);

export const fetchContentfulAppsConfig = async ({
  organizationId,
  appId,
  spaceId,
  environmentId,
}: UseContentfulAppsConfig): Promise<AppState> => {
  const [isPurchased, isEnabled, isInstalled, isTrialAvailable, appsTrial] = await Promise.all(
    [
      getOrgFeature(organizationId, APPS_CONFIG[appId].catalogFlag, false),
      getVariation(APPS_CONFIG[appId].featureFlag, {
        organizationId,
        spaceId,
        environmentId,
      } as any),
      checkInstalledApp(appId),
      canStartAppTrial(organizationId as string),
      AppTrialRepo.getTrial(organizationId, 'compose_app'),
    ].map(fallBackClose)
  );

  return {
    isPurchased,
    isEnabled,
    isInstalled,
    isTrialAvailable,
    isTrialActive: isActiveAppTrial(appsTrial),
  };
};

export interface AppState {
  isInstalled?: boolean;
  isEnabled?: boolean;
  isPurchased?: boolean;
  isTrialAvailable?: boolean;
  isTrialActive?: boolean;
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
    const fetchData = async () => {
      const appsConfig = await fetchContentfulAppsConfig({
        appId,
        organizationId,
        spaceId,
        environmentId,
      });
      if (mounted) {
        setAppState({ ...appsConfig });
      }
    };
    fetchData();

    return () => {
      mounted = false;
    };
  }, [appId, organizationId, spaceId, environmentId]);

  return appState;
};
