import getOrgId from './getOrgId';
import getOrganizationsList from './getOrganizationsList';
import { find, get } from 'lodash';

export default (state) => {
  const orgId = getOrgId(state);

  if (!orgId) {
    return null;
  }

  const organizations = getOrganizationsList(state);

  if (!organizations) {
    return null;
  }

  return find(organizations, (org) => get(org, ['sys', 'id']) === orgId);
};
