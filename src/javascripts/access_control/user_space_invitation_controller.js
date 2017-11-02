'use strict';

/**
 * @ngdoc type
 * @name UserSpaceInvitationController
 *
 * @scope.requires {Array} users
 * @scope.requires {Array} roleOptions - available role options in the format of { id, name }
 * @scope.requires {modalDialog} dialog
 * @scope.requires {fn} goBackToSelection - fn to go back to the previous step
 */
angular.module('contentful')
.controller('UserSpaceInvitationController', ['require', '$scope', function (require, $scope) {
  var $q = require('$q');
  var $timeout = require('$timeout');
  var spaceContext = require('spaceContext');

  // A hash with user ids as keys, and role ids as values
  $scope.selectedRoles = {};

  this.tryInviteSelectedUsers = tryInviteSelectedUsers;
  this.getInvalidRoleSelectionsCount = getInvalidRoleSelectionsCount;

  function tryInviteSelectedUsers () {
    $scope.canNotInvite = getInvalidRoleSelectionsCount() > 0;
    if (!$scope.canNotInvite) {
      return inviteUsers();
    } else {
      return $q.reject();
    }
  }

  function getInvalidRoleSelectionsCount () {
    var invalidUsers = $scope.users.filter(function (user) {
      return !$scope.selectedRoles[user.sys.id];
    });
    return invalidUsers.length;
  }

  function inviteUsers () {
    $scope.hasFailedInvitations = false;
    $scope.invitationsScheduled = $scope.users.length;
    $scope.invitationsDone = 0;

    var invitees = $scope.users.map(function (user) {
      return {
        user: user,
        roleId: $scope.selectedRoles[user.sys.id]
      };
    });
    var currentInvitationId = 0;

    return $q.all(invitees.map(scheduleInvitation)).then(function () {
      $scope.dialog.confirm();
    }, function () {
      $scope.hasFailedInvitations = true;
      $scope.invitationsScheduled = 0;
      $scope.invitationsDone = 0;
    });

    function scheduleInvitation (invitee) {
      var i = currentInvitationId++;
      // We wait 350ms between invitations to avoid rate limitation errors
      // @TODO we need a backend endpoint for batch invitation:
      // https://contentful.tpondemand.com/entity/17146
      return $timeout(350 * i).then(function () {
        return spaceContext.memberships.invite(invitee.user.email, [invitee.roleId])
        .then(function () {
          $scope.invitationsDone++;
          $scope.users = _.without($scope.users, invitee.user);
        });
      });
    }
  }
}]);
