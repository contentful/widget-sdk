import moment from 'moment';

export const calcTrialDaysLeft = (trialEndDate) => {
  if (!trialEndDate) {
    return;
  }
  return Math.abs(moment().startOf('day').diff(moment(trialEndDate), 'days'));
};
