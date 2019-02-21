import { get, keyBy } from 'lodash';
import { getDatasets } from './datasets.es6';
import { ORG_MEMBERSHIPS } from 'redux/datasets.es6';

export default state => {
  const datasets = getDatasets(state);
  const orgMemberships = datasets[ORG_MEMBERSHIPS];

  if (!orgMemberships) {
    return null;
  }

  // for consistency.
  // new invitations are not pending org memberships anymore and wouldn't be included either way
  const withoutInvitations = Object.values(orgMemberships).filter(
    membership => !!get(membership, 'sys.user.firstName')
  );

  // maps are in general easier and more performant to access
  // could be cached, but number of org memberships is low
  return keyBy(withoutInvitations, 'sys.id');
};
