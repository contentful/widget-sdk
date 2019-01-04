import getDatasets from './getDatasets.es6';
import { ORG_MEMBERSHIPS, USERS } from 'redux/dataSets.es6';

export default state => {
  const datasets = getDatasets(state);
  const users = datasets[USERS];
  const orgMemberships = datasets[ORG_MEMBERSHIPS];

  if (!users || !orgMemberships) {
    return null;
  }

  const withoutInvitations = Object.values(orgMemberships).filter(
    membership => !!membership.sys.user.firstName
  );

  return withoutInvitations;
};
