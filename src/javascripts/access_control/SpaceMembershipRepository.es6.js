import { fetchAll } from 'data/CMA/FetchAll';
import { omit, extend } from 'lodash';


export const ADMIN_ROLE_ID = '__cf_builtin_admin';


// `GET /spaces/:id/space_memberships` endpoint returns a max of 100 items
const PER_PAGE = 100;

/**
 * Creates an object that manages the user members of a space.
 *
 * This object must only be created by 'spaceContext'. It is mocked in
 * 'mocks/space_context'
 */
export function create (spaceEndpoint) {
  return {
    getAll: getAll,
    invite: invite,
    changeRoleTo: changeRoleTo,
    remove: remove
  };

  function invite (email, roleId) {
    return spaceEndpoint({
      method: 'POST',
      path: ['space_memberships'],
      data: newMembership(email, roleId)
    });
  }

  function getAll () {
    return fetchAll(spaceEndpoint, ['space_memberships'], PER_PAGE);
  }

  function changeRoleTo (membership, roleId) {
    let newMembership;
    if (roleId === ADMIN_ROLE_ID) {
      newMembership = prepareAdminMembership(membership);
    } else {
      newMembership = prepareRoleMembership(membership, roleId);
    }
    return changeRole(membership, newMembership);
  }

  function remove (membership) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['space_memberships', membership.sys.id.toString()]
    });
  }

  function changeRole (oldMembership, newMembership) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['space_memberships', oldMembership.sys.id],
      version: oldMembership.sys.version,
      data: newMembership
    });
  }
}

function newMembership (email, roleId) {
  const membership = {
    email: email,
    admin: roleId === ADMIN_ROLE_ID
  };
  if (roleId !== ADMIN_ROLE_ID) {
    membership.roles = getRoleLink(roleId);
  }
  return membership;
}

function prepareAdminMembership (membership) {
  const base = omit(membership, ['sys', 'user']);
  return extend(base, { admin: true, roles: [] });
}

function prepareRoleMembership (membership, roleId) {
  const base = omit(membership, ['sys', 'user']);
  return extend(base, { admin: false, roles: getRoleLink(roleId) });
}

function getRoleLink (roleId) {
  return [{ type: 'Link', linkType: 'Role', id: roleId }];
}
