'use strict';

angular.module('contentful').factory('SpaceMembershipRepository', [function () {

  return { getInstance: getInstance };

  function getInstance(space) {

    return {
      getAll: getAll,
      invite: invite,
      inviteAdmin: inviteAdmin,
      changeRoleTo: changeRoleTo,
      changeRoleToAdmin: changeRoleToAdmin,
      remove: remove
    };

    function invite(mail, roleId) {
      return getBaseCall()
      .payload({
        email: mail,
        admin: false,
        roles: getRoleLink(roleId)
      })
      .post();
    }

    function inviteAdmin(mail) {
      return getBaseCall()
      .payload({ email: mail, admin: true })
      .post();
    }

    function getAll() {
      return getBaseCall()
      .payload({ limit: 100 })
      .get().then(function (res) { return res.items; });
    }

    function changeRoleTo(membership, roleId) {
      var newMembership = prepareRoleMembership(membership, roleId);
      return changeRole(membership, newMembership);
    }

    function changeRoleToAdmin(membership) {
      var newMembership = prepareAdminMembership(membership);
      return changeRole(membership, newMembership);
    }

    function changeRole(oldMembership, newMembership) {
      return getBaseCall({
        id: oldMembership.sys.id,
        version: oldMembership.sys.version
      })
      .payload(newMembership)
      .put();
    }

    function remove(membership) {
      return getBaseCall({
        id: membership.sys.id,
        rejectEmpty: false
      })
      .delete();
    }

    function getBaseCall(config) {
      var headers = {};
      config = config || {};
      if (config.version) {
        headers['X-Contentful-Version'] = config.version;
      }

      var call = space.endpoint('space_memberships', config.id).headers(headers);
      return config.rejectEmpty ? call.rejectEmpty() : call;
    }
  }

  function prepareAdminMembership(membership) {
    var base = _.omit(membership, ['sys', 'user']);
    return _.extend(base, { admin: true, roles: [] });
  }

  function prepareRoleMembership(membership, roleId) {
    var base = _.omit(membership, ['sys', 'user']);
    return _.extend(base, { admin: false, roles: getRoleLink(roleId) });
  }

  function getRoleLink(roleId) {
    return [{ type: 'Link', linkType: 'Role', id: roleId }];
  }
}]);
