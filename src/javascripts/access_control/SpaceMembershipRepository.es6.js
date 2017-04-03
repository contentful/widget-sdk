import {fetchAll} from 'data/CMA/FetchAll';
import {omit, assign} from 'lodash';

// `GET /spaces/:id/space_memberships` endpoint returns a max of 100 items
const PER_PAGE = 100;

/**
 * Creates an object that manages the user members of a space.
 *
 * This object must only be created by 'spaceContext'. It is mocked in
 * 'mocks/space_context'
 *
 * TODO Merge 'invite' and 'inviteAdmin'. The logic should be
 * determined by the 'roleId' argument. Same for 'changeRoleTo'.
 */
export function create (spaceEndpoint) {
  return {
    getAll: getAll,
    invite: invite,
    inviteAdmin: inviteAdmin,
    changeRoleTo: changeRoleTo,
    changeRoleToAdmin: changeRoleToAdmin,
    remove: remove
  };

  function invite (mail, roleId) {
    return spaceEndpoint({
      method: 'POST',
      path: ['space_memberships'],
      data: {
        email: mail,
        admin: false,
        roles: getRoleLink(roleId)
      }
    });
  }

  function inviteAdmin (mail) {
    return spaceEndpoint({
      method: 'POST',
      path: ['space_memberships'],
      data: { email: mail, admin: true }
    });
  }

  function getAll () {
    return fetchAll(spaceEndpoint, ['space_memberships'], PER_PAGE);
  }

  function changeRoleTo (membership, roleId) {
    const newMembership = prepareRoleMembership(membership, roleId);
    return changeRole(membership, newMembership);
  }

  function changeRoleToAdmin (membership) {
    const newMembership = prepareAdminMembership(membership);
    return changeRole(membership, newMembership);
  }

  function changeRole (oldMembership, newMembership) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['space_memberships', oldMembership.sys.id],
      version: oldMembership.sys.version,
      data: newMembership
    });
  }

  function remove (membership) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['space_memberships', membership.sys.id.toString()]
    });
  }
}

function prepareAdminMembership (membership) {
  const base = omit(membership, ['sys', 'user']);
  return assign(base, { admin: true, roles: [] });
}

function prepareRoleMembership (membership, roleId) {
  const base = omit(membership, ['sys', 'user']);
  return assign(base, { admin: false, roles: getRoleLink(roleId) });
}

function getRoleLink (roleId) {
  return [{ type: 'Link', linkType: 'Role', id: roleId }];
}
