import { get, groupBy } from 'lodash';
import { getDatasets } from './datasets';
import { ORG_SPACE_ROLES } from '../datasets';

/**
 * @description
 * Get roles as map keyed by space id
 *
 * Depends on the respective dataset to be loaded
 *
 * @return {Object}
 */
export default state => {
  const datasets = getDatasets(state);
  const roles = get(datasets, ORG_SPACE_ROLES, {});
  return groupBy(roles, 'sys.space.sys.id');
};
