import { sum } from 'lodash';

export default (spaceUsage, totalUsage) => {
  return !totalUsage ? 0 : Math.round((sum(spaceUsage) / totalUsage) * 100);
};
