import getDatasets from './getDatasets.es6';
import resolveLinks from 'app/OrganizationSettings/LinkResolver.es6';
import { ORG_MEMBERSHIPS, USERS } from 'redux/dataSets.es6';

export default state => {
  const datasets = getDatasets(state);
  const users = datasets[USERS];
  const orgMemberships = datasets[ORG_MEMBERSHIPS];

  if (!users || !orgMemberships) {
    return null;
  }

  const resolved = resolveLinks({
    paths: ['sys.user'],
    includes: { User: users },
    items: orgMemberships
  });
  const withoutInvitations = resolved.filter(membership => !!membership.sys.user.firstName);

  return withoutInvitations;
};
