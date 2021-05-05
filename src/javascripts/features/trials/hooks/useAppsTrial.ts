import type { Trial } from '@contentful/experience-cma-utils';

import { useEffect, useState } from 'react';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import { getTrialsWithCache } from '../services/TrialService';
import { hasExpired, isActive } from '../utils/utils';

const isAppsTrial = (trial: Trial) => trial.productId === 'add_on_compose_launch';

const isAppsTrialSpace = (trial: Trial) => trial.sys.parent && trial.productId === 'space_size_3';

export function useAppsTrial(organizationId?: string) {
  const [canStartTrial, setCanStartTrial] = useState<boolean>(false);
  const [isAppsTrialActive, setIsAppsTrialActive] = useState<boolean>(false);
  const [hasAppsTrialExpired, setHasAppsTrialExpired] = useState<boolean>(false);
  const [appsTrialSpaceKey, setAppsTrialSpaceKey] = useState<string>();
  const [appsTrialEndsAt, setAppsTrialEndsAt] = useState<string>();

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

      setCanStartTrial(!appsTrial && !hasAppsFeature);
      setAppsTrialSpaceKey(appsTrialSpace?.sys.space?.sys.id);
      setIsAppsTrialActive(isActive(appsTrial));
      setHasAppsTrialExpired(hasExpired(appsTrial));
      setAppsTrialEndsAt(appsTrial && appsTrial.endsAt);
    };

    fetchData();
  }, [organizationId]);

  return {
    canStartTrial,
    appsTrialSpaceKey,
    isAppsTrialActive,
    hasAppsTrialExpired,
    appsTrialEndsAt,
  };
}
