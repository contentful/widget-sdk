import _, { filter } from 'lodash';

import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo';
import { getInstance as getRoleRepoInstance } from 'access_control/RoleRepository';
import { getModule } from 'NgRegistry';

import { ADMIN_ROLE_ID } from './constants';

export const ADMIN_ROLE_NAME = 'Administrator';
const ADMIN_OPT = { id: ADMIN_ROLE_ID, name: ADMIN_ROLE_NAME };

export function create() {
  const spaceContext = getModule('spaceContext');

  let roleCounts = {};
  let roleOptions = [];
  let memberships = [];

  return {
    reset,
    getMemberships: () => memberships,
    getRoleCounts: () => roleCounts,
    getRoleOptions: () => roleOptions,
  };

  async function reset() {
    const { endpoint, space } = spaceContext;
    const [_memberships, roles] = await Promise.all([
      createSpaceMembersRepo(endpoint).getAll(),
      getRoleRepoInstance(space).getAll(),
    ]);

    memberships = _memberships;
    roleCounts = {
      admin: filter(memberships, 'admin').length,
      ..._(memberships).flatMap('roles').countBy('sys.id').value(),
    };

    roleOptions = [ADMIN_OPT].concat(roles.map(({ name, sys: { id } }) => ({ id, name })));

    return { memberships, roles };
  }
}
