import type { Trial } from '@contentful/experience-cma-utils/dist/internal-endpoints/utils/types';

import { useEffect, useState } from 'react';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';

const isAppsTrial = (trial: Trial) => trial.productId === 'add_on_compose_launch';
const isAppsTrialSpace = (trial: Trial) => trial.sys.parent && trial.productId === 'space_size_3';

export function useAppsTrial(organizationId?: string) {
  const [canStartTrial, setCanStartTrial] = useState<boolean>(false);
  const [appsTrialSpaceKey, setAppsTrialSpaceKey] = useState<string>();

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        return;
      }

      const [trials, hasAppsFeature] = await Promise.all([
        getCMAClient({ organizationId }).internal.trials.get(),
        getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_COMPOSE_APP),
      ]);

      const [appsTrial] = trials.items.filter(isAppsTrial);
      const [appsTrialSpace] = trials.items.filter(isAppsTrialSpace);

      // Organization hasn't trialed 'add_on_compose_launch' and feature hasn't
      // been purchased.
      setCanStartTrial(!appsTrial && !hasAppsFeature);
      setAppsTrialSpaceKey(appsTrialSpace?.sys.space?.sys.id);
    };

    fetchData();
  }, [organizationId]);

  return {
    canStartTrial,
    appsTrialSpaceKey,
  };
}
