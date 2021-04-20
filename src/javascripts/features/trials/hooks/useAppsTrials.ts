import { useEffect, useState } from 'react';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';

export function useAppsTrial(organizationId?: string) {
  const [canStartTrial, setCanStartTrial] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        return Promise.reject('No organization Id provided when fetching trials');
      }

      const trialsClient = getCMAClient({ organizationId }).internal.trials;
      const trials = await trialsClient
        .get()
        .then((trials) =>
          trials.items.filter((trial) => trial.productId === 'add_on_compose_launch')
        );
      const hasAppsFeature = await getOrgFeature(
        organizationId,
        OrganizationFeatures.PC_ORG_COMPOSE_APP
      );
      setCanStartTrial(!trials.length && !hasAppsFeature);
    };

    fetchData();
  }, [organizationId]);

  return { canStartTrial };
}
