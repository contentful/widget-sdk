import moment from 'moment';

export const calcTrialDaysLeft = (trialEndDate?: string) => {
  if (!trialEndDate) {
    return;
  }
  return Math.abs(moment().startOf('day').diff(moment(trialEndDate), 'days'));
};
