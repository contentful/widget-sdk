import { fetchAll } from 'data/CMA/FetchAll';
import { omit, extend, includes } from 'lodash';

export const ADMIN_ROLE_ID = '__cf_builtin_admin';

// `GET /spaces/:id/space_memberships` endpoint returns a max of 100 items
const PER_PAGE = 100;

/**
 * Creates an object that manages the user members of a space.
 *
 * This object must only be created by 'spaceContext'. It is mocked in
 * 'mocks/space_context'
 */
export function create(spaceEndpoint) {
  return {
    getAll: getAll,
    invite: invite,
    changeRoleTo: changeRoleTo,
    remove: remove
  };

  function invite(email, roleIds) {
    return spaceEndpoint({
      method: 'POST',
      path: ['space_memberships'],
      data: newMembership(email, roleIds)
    });
  }

  function getAll() {
    return fetchAll(spaceEndpoint, ['space_memberships'], PER_PAGE);
  }

  function changeRoleTo(membership, roleIds) {
    let newMembership;
    if (includes(roleIds, ADMIN_ROLE_ID)) {
      newMembership = prepareAdminMembership(membership);
    } else {
      newMembership = prepareRoleMembership(membership, roleIds);
    }
    return changeRole(membership, newMembership);
  }

  function remove(membership) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['space_memberships', membership.sys.id.toString()]
    });
  }

  function changeRole(oldMembership, newMembership) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['space_memberships', oldMembership.sys.id],
      version: oldMembership.sys.version,
      data: newMembership
    });
  }
}

function newMembership(email, roleIds) {
  const membership = {
    email: email,
    admin: includes(roleIds, ADMIN_ROLE_ID)
  };
  if (!membership.admin) {
    membership.roles = getRoleLinks(roleIds);
  }
  return membership;
}

function prepareAdminMembership(membership) {
  const base = omit(membership, ['sys', 'user']);
  return extend(base, { admin: true, roles: [] });
}

function prepareRoleMembership(membership, roleIds) {
  const base = omit(membership, ['sys', 'user']);
  return extend(base, { admin: false, roles: getRoleLinks(roleIds) });
}

function getRoleLinks(roleIds) {
  return roleIds.map(id => ({ type: 'Link', linkType: 'Role', id: id }));
}
