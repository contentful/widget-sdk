import moment from 'moment';
import { memoize } from 'lodash';

import { OrganizationProp } from 'contentful-management/types';
import { getCMAClient } from 'core/services/usePlainCMAClient';

/**
 * Return True if an organization is on active trial.
 */
export const isOrganizationOnTrial = (organization?: OrganizationProp): boolean => {
  if (!organization) {
    return false;
  }
  // @ts-expect-error expect trialPeriodEndsAt
  const endDate = organization.trialPeriodEndsAt;
  return endDate ? moment().isSameOrBefore(moment(endDate), 'date') : false;
};

export const getTrialsWithCache = memoize(async (organizationId: string) => {
  const trials = await getCMAClient({ organizationId }).internal.trials.get();
  return trials.items;
});

export function clearTrialsCache() {
  getTrialsWithCache.cache.clear?.();
}
