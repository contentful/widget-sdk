import type { Trial } from '@contentful/experience-cma-utils/dist/internal-endpoints/utils/types';

import { useEffect, useState } from 'react';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import { memoize } from 'lodash';

const isAppsTrial = (trial: Trial) => trial.productId === 'add_on_compose_launch';

const isAppsTrialSpace = (trial: Trial) => trial.sys.parent && trial.productId === 'space_size_3';

const isActive = (trial: Trial) => {
  const today = new Date(new Date().toDateString());
  const endsAt = new Date(trial.endsAt);
  return today <= endsAt;
};

const hasExpired = (trial: Trial) => {
  const today = new Date(new Date().toDateString());
  const endsAt = new Date(trial.endsAt);
  return today > endsAt;
};

const trialsWithCache = memoize((organizationId) =>
  getCMAClient({ organizationId }).internal.trials.get()
);

export function clearAppsTrialCache() {
  trialsWithCache.cache.clear?.();
}

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
        trialsWithCache(organizationId),
        getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_COMPOSE_APP),
      ]);

      const [appsTrial] = trials.items.filter(isAppsTrial);
      const [appsTrialSpace] = trials.items.filter(isAppsTrialSpace);

      setCanStartTrial(!appsTrial && !hasAppsFeature);
      setAppsTrialSpaceKey(appsTrialSpace?.sys.space?.sys.id);
      setIsAppsTrialActive(appsTrial && isActive(appsTrial));
      setHasAppsTrialExpired(appsTrial && hasExpired(appsTrial));
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
