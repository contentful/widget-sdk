import { Organization, SpaceData } from 'core/services/SpaceEnvContext/types';
import moment from 'moment';

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
 * Return True if a space is on active trial.
 */
export const isSpaceOnTrial = (space?: SpaceData): boolean => {
  if (!space) {
    return false;
  }
  const endDate = space.trialPeriodEndsAt;
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

/**
 * Return True if a space is an expired Trial Space.
 */
export const isExpiredTrialSpace = (space?: SpaceData): boolean => {
  if (!space) {
    return false;
  }
  return isTrialSpaceType(space) && !isSpaceOnTrial(space);
};
