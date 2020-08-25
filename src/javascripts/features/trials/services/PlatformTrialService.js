import moment from 'moment';

/**
 * Return True if an organization is on platform trial.
 *
 * @param  {Organization} organization - Organization object
 * @return {Boolean}
 */
export const isOrgOnPlatformTrial = (organization) => {
  // endDate is null if organization has never been on trial
  const endDate = organization.trialPeriodEndsAt;
  return endDate ? moment().isSameOrBefore(moment(endDate), 'date') : false;
};
