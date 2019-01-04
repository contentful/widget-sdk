import { get } from 'lodash';
import getDatasets from './getDatasets.es6';
import { ORG_MEMBERSHIPS } from 'redux/dataSets.es6';

export default state => {
  const datasets = getDatasets(state);
  const orgMemberships = datasets[ORG_MEMBERSHIPS];

  if (!orgMemberships) {
    return null;
  }

  const withoutInvitations = Object.values(orgMemberships).filter(
    membership => !!get(membership, 'sys.user.firstName')
  );

  return withoutInvitations;
};
