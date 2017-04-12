'use strict';

/**
 * @ngdoc type
 * @name UserSpaceInvitationController
 *
 * @scope.requires {Array} users
 * @scope.requires {Array} roleOptions
 * @scope.requires {Array} selectedRoles
 * @scope.requires {modalDialog} dialog
 */
angular.module('contentful')
.controller('UserSpaceInvitationController', ['require', '$scope', function (require, $scope) {

  var $q = require('$q');
  var $timeout = require('$timeout');
  var spaceContext = require('spaceContext');

  $scope.tryInviteSelectedUsers = function () {
    $scope.canNotInvite = $scope.getInvalidRoleSelectionsCount() > 0;
    if (!$scope.canNotInvite) {
      inviteUsers();
    }
  };

  $scope.getInvalidRoleSelectionsCount = function () {
    var userIds = $scope.users.map(_.property('sys.id'));
    var roleIds = $scope.roleOptions.map(_.property('id'));
    var assignedUserIds = _($scope.selectedRoles).pickBy(isValidRole).keys().value();
    return _.difference(userIds, assignedUserIds).length;

    function isValidRole (roleId) {
      return _.includes(roleIds, roleId);
    }
  };

  function inviteUsers () {
    resetInvitationsCounter();

    var invitees = $scope.users.map(function (user) {
      return {
        user: user,
        roleId: $scope.selectedRoles[user.sys.id]
      };
    });

    return $q.all(_.map(invitees, scheduleInvitation)).then(function () {
      $scope.dialog.confirm();
    }, function () {
      $scope.hasFailedInvitations = true;
    });

    function scheduleInvitation (invitee) {
      var i = $scope.invitationsScheduled++;
      // We wait 350ms between invitations to avoid rate limitation errors
      // @TODO we need a backend endpoint for batch invitation:
      // https://contentful.tpondemand.com/entity/17146
      return $timeout(350 * i).then(function () {
        return spaceContext.memberships.invite(invitee.user.email, invitee.roleId)
        .then(function () {
          $scope.invitationsDone++;
          $scope.users = _.without($scope.users, invitee.user);
        });
      });
    }

    function resetInvitationsCounter () {
      $scope.hasFailedInvitations = false;
      $scope.invitationsScheduled = 0;
      $scope.invitationsDone = 0;
    }
  }
}]);
