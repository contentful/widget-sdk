import { useEffect, useState } from 'react';
import type { Trial } from '@contentful/experience-cma-utils';
import { getTrialsWithCache } from '../services/TrialService';
import { hasExpired, isActive } from '../utils/utils';
import { useAppsTrial } from './useAppsTrial';

const isTrialSpace = (trial: Trial) =>
  trial.productId === 'space_size_5' || trial.productId === 'space_size_3';

type TrialSpaceSpace = {
  isActiveTrialSpace: boolean;
  hasTrialSpaceExpired: boolean;
  hasTrialSpaceConverted: boolean;
  trialSpaceExpiresAt: string | undefined;
  matchesAppsTrialSpaceKey: boolean;
};

const initialState = {
  isActiveTrialSpace: false,
  hasTrialSpaceExpired: false,
  hasTrialSpaceConverted: false,
  trialSpaceExpiresAt: undefined,
  matchesAppsTrialSpaceKey: false,
};

export const useTrialSpace = (organizationId?: string, spaceId?: string) => {
  const [trialSpaceState, setTrialSpaceState] = useState<TrialSpaceSpace>(initialState);

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

      setTrialSpaceState({
        isActiveTrialSpace: isActive(trial),
        hasTrialSpaceExpired: hasExpired(trial),
        hasTrialSpaceConverted: Boolean(trial?.convertedAt),
        trialSpaceExpiresAt: trial?.endsAt,
        matchesAppsTrialSpaceKey: spaceId === appsTrialSpaceKey,
      });
    };

    fetchData();
  }, [organizationId, spaceId, appsTrialSpaceKey]);

  return trialSpaceState;
};
