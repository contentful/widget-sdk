import { keyBy } from 'lodash';
import { getDatasets } from './datasets';
import { ORG_MEMBERSHIPS } from 'redux/datasets';

export default (state) => {
  const datasets = getDatasets(state);
  const orgMemberships = datasets[ORG_MEMBERSHIPS];

  if (!orgMemberships) {
    return null;
  }

  // maps are in general easier and more performant to access
  // could be cached, but number of org memberships is low
  return keyBy(orgMemberships, 'sys.id');
};
