import moment from 'moment';

export const calcTrialDaysLeft = (trialEndDate?: string | null) => {
  if (!trialEndDate) {
    return -1;
  }
  return Math.abs(moment().startOf('day').diff(moment(trialEndDate), 'days'));
};
