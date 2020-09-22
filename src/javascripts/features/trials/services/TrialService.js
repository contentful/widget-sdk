import moment from 'moment';

/**
 * Return True if an organization is on trial.
 *
 * @param  {object} organization - Organization object
 * @return {boolean}
 */
export const isOrganizationOnTrial = (organization) => {
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
  return 'trialPeriodEndsAt' in space;
};
