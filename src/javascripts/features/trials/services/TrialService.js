import moment from 'moment';

/**
 * Return True if an organization is on trial.
 *
 * @param  {object} organization - Organization object
 * @return {boolean}
 */
export const isOrganizationOnTrial = (organization) => {
  if (!organization) {
    return false;
  }
  // endDate is null if organization has never been on trial
  const endDate = organization.trialPeriodEndsAt;
  return endDate ? moment().isSameOrBefore(moment(endDate), 'date') : false;
};

/**
 * Return True if a space is on active trial.
 *
 * @param  {object} space - Space object
 * @return {boolean}
 */
export const isSpaceOnTrial = (space) => {
  if (!space) {
    return false;
  }
  const endDate = space.trialPeriodEndsAt;
  return endDate ? moment().isSameOrBefore(moment(endDate), 'date') : false;
};

/**
 * Return True if a space is a Trial Space type (includes read-only)
 *
 * @param  {object} space - Space object
 * @return {boolean}
 */
export const isTrialSpaceType = (space) => {
  if (!space) {
    return false;
  }
  return 'trialPeriodEndsAt' in space;
};

/**
 * Return True if a trial space is expired.
 *
 * @param  {object} space - Space object
 * @return {boolean}
 */
export const isExpiredTrialSpace = (space) => {
  if (!space) {
    return false;
  }
  return isTrialSpaceType(space) && !isSpaceOnTrial(space);
};
