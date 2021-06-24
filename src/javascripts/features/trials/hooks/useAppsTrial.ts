import { useEffect, useState } from 'react';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import { getTrialsWithCache } from '../services/TrialService';
import { hasExpired, isActive, isAppsTrial, isAppsTrialSpace } from '../utils/utils';

type AppsTrialState = {
  canStartTrial: boolean;
  isAppsTrialActive: boolean;
  hasAppsTrialExpired: boolean;
  hasAppsTrialPurchased: boolean;
  appsTrialSpaceKey: string | undefined;
  appsTrialEndsAt: string | undefined;
};

const initialState = {
  canStartTrial: false,
  isAppsTrialActive: false,
  hasAppsTrialExpired: false,
  hasAppsTrialPurchased: false,
  appsTrialSpaceKey: undefined,
  appsTrialEndsAt: undefined,
};

export function useAppsTrial(organizationId?: string) {
  const [appsTrialState, setAppsTrialState] = useState<AppsTrialState>(initialState);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        return;
      }

      const [trials, hasAppsFeature] = await Promise.all([
        getTrialsWithCache(organizationId),
        getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_COMPOSE_APP),
      ]);

      const [appsTrial] = trials.filter(isAppsTrial);
      const [appsTrialSpace] = trials.filter(isAppsTrialSpace);

      setAppsTrialState({
        canStartTrial: !appsTrial && !hasAppsFeature,
        isAppsTrialActive: isActive(appsTrial),
        hasAppsTrialExpired: hasExpired(appsTrial),
        hasAppsTrialPurchased: Boolean(appsTrial?.convertedAt),
        appsTrialSpaceKey: appsTrialSpace?.sys.space?.sys.id,
        appsTrialEndsAt: appsTrial?.endsAt,
      });
    };

    fetchData();
  }, [organizationId]);

  return appsTrialState;
}
