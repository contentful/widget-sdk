import _, { filter } from 'lodash';

import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo.es6';

import { getModule } from '../NgRegistry.es6';
import RoleRepository from './RoleRepository.es6';
import { ADMIN_ROLE_ID } from './constants.es6';

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
    getRoleOptions: () => roleOptions
  };

  async function reset() {
    const { endpoint, space } = spaceContext;
    const result = Promise.all([
      createSpaceMembersRepo(endpoint).getAll(),
      RoleRepository.getInstance(space).getAll()
    ]);

    memberships = result.memberships;
    roleCounts = {
      admin: filter(result.memberships, 'admin').length,
      ..._(result.memberships)
        .flatMap('roles')
        .countBy('sys.id')
        .value()
    };

    roleOptions = [ADMIN_OPT].concat(result.roles.map(({ name, sys: { id } }) => ({ id, name })));

    return { memberships: result.memberships, roles: result.roles };
  }
}
