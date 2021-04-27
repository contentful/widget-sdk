import { sum } from 'lodash';

export const calcRelativeSpaceUsage = (spaceUsage, totalUsage) => {
  return !totalUsage ? 0 : Math.round((sum(spaceUsage) / totalUsage) * 100);
};
