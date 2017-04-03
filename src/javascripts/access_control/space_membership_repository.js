'use strict';

angular.module('contentful').factory('SpaceMembershipRepository', ['require', function (require) {
  var fetchAll = require('data/CMA/FetchAll').fetchAll;

  // `GET /spaces/:id/space_memberships` endpoint returns a max of 100 items
  var PER_PAGE = 100;

  return { getInstance: getInstance };

  function getInstance (spaceEndpoint) {

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
      var newMembership = prepareRoleMembership(membership, roleId);
      return changeRole(membership, newMembership);
    }

    function changeRoleToAdmin (membership) {
      var newMembership = prepareAdminMembership(membership);
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
    var base = _.omit(membership, ['sys', 'user']);
    return _.extend(base, { admin: true, roles: [] });
  }

  function prepareRoleMembership (membership, roleId) {
    var base = _.omit(membership, ['sys', 'user']);
    return _.extend(base, { admin: false, roles: getRoleLink(roleId) });
  }

  function getRoleLink (roleId) {
    return [{ type: 'Link', linkType: 'Role', id: roleId }];
  }
}]);
