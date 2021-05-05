import moment from 'moment';
import { memoize } from 'lodash';

import { Organization, SpaceData } from 'core/services/SpaceEnvContext/types';
import { getCMAClient } from 'core/services/usePlainCMAClient';

/**
 * Return True if an organization is on active trial.
 */
export const isOrganizationOnTrial = (organization?: Organization): boolean => {
  if (!organization) {
    return false;
  }
  const endDate = organization.trialPeriodEndsAt;
  return endDate ? moment().isSameOrBefore(moment(endDate), 'date') : false;
};

/**
 * Return True if a space is a Trial Space type.
 */
export const isTrialSpaceType = (space?: SpaceData): boolean => {
  if (!space) {
    return false;
  }
  return 'trialPeriodEndsAt' in space;
};

export const getTrialsWithCache = memoize(async (organizationId: string) => {
  const trials = await getCMAClient({ organizationId }).internal.trials.get();
  return trials.items;
});

export function clearTrialsCache() {
  getTrialsWithCache.cache.clear?.();
}
