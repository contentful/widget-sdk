import { useEffect, useState } from 'react';
import type { Trial } from '@contentful/experience-cma-utils';
import { getTrialsWithCache } from '../services/TrialService';
import { hasExpired, isActive } from '../utils/utils';
import { useAppsTrial } from './useAppsTrial';

const isTrialSpace = (trial: Trial) =>
  trial.productId === 'space_size_5' || trial.productId === 'space_size_3';

export const useTrialSpace = (organizationId?: string, spaceId?: string) => {
  const [isActiveTrialSpace, setIsActiveTrialSpace] = useState<boolean>(false);
  const [hasTrialSpaceExpired, setHasTrialSpaceExpired] = useState<boolean>(false);
  const [hasTrialSpaceConverted, setHasTrialSpaceConverted] = useState<boolean>(false);
  const [trialSpaceExpiresAt, setTrialSpaceExpiresAt] = useState<string | undefined>();
  const [matchesAppsTrialSpaceKey, setMatchesAppsTrialSpaceKey] = useState<boolean>(false);

  const { appsTrialSpaceKey } = useAppsTrial(organizationId);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId || !spaceId) {
        return;
      }

      const trials = await getTrialsWithCache(organizationId);

      const trial = trials.find(
        (trial) => trial.sys.space?.sys.id === spaceId && isTrialSpace(trial)
      );

      setIsActiveTrialSpace(isActive(trial));
      setMatchesAppsTrialSpaceKey(spaceId === appsTrialSpaceKey);
      setHasTrialSpaceExpired(hasExpired(trial));
      setHasTrialSpaceConverted(Boolean(trial?.convertedAt));
      setTrialSpaceExpiresAt(trial?.endsAt);
    };

    fetchData();
  }, [organizationId, spaceId, appsTrialSpaceKey]);

  return {
    isActiveTrialSpace,
    hasTrialSpaceConverted,
    hasTrialSpaceExpired,
    matchesAppsTrialSpaceKey,
    trialSpaceExpiresAt,
  };
};
