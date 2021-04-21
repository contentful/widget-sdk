import moment from 'moment';
import { getSpaces } from 'services/TokenStore';

export const calcTrialDaysLeft = (trialEndDate?: string | null) => {
  if (!trialEndDate) {
    return -1;
  }
  return Math.abs(moment().startOf('day').diff(moment(trialEndDate), 'days'));
};

export const isSpaceAccessible = async (spaceId?: string) => {
  if (!spaceId) {
    return false;
  }

  const accessibleSpaces = await getSpaces();

  return !!accessibleSpaces.find((space) => space.sys.id === spaceId);
};
