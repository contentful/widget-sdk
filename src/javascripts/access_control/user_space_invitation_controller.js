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
angular.module('contentful').controller('UserSpaceInvitationController', [
  'require',
  '$scope',
  function(require, $scope) {
    const _ = require('lodash');
    const $q = require('$q');
    const $timeout = require('$timeout');
    const spaceContext = require('spaceContext');

    // A hash with user ids as keys, and role ids as values
    $scope.selectedRoles = {};

    this.tryInviteSelectedUsers = tryInviteSelectedUsers;
    this.getInvalidRoleSelectionsCount = getInvalidRoleSelectionsCount;

    function tryInviteSelectedUsers() {
      $scope.canNotInvite = getInvalidRoleSelectionsCount() > 0;
      if (!$scope.canNotInvite) {
        return inviteUsers();
      } else {
        return $q.reject();
      }
    }

    function getInvalidRoleSelectionsCount() {
      const invalidUsers = $scope.users.filter(user => !$scope.selectedRoles[user.sys.id]);
      return invalidUsers.length;
    }

    function inviteUsers() {
      $scope.hasFailedInvitations = false;
      $scope.invitationsScheduled = $scope.users.length;
      $scope.invitationsDone = 0;

      const invitees = $scope.users.map(user => ({
        user: user,
        roleId: $scope.selectedRoles[user.sys.id]
      }));
      let currentInvitationId = 0;

      return $q.all(invitees.map(scheduleInvitation)).then(
        () => {
          $scope.dialog.confirm();
        },
        () => {
          $scope.hasFailedInvitations = true;
          $scope.invitationsScheduled = 0;
          $scope.invitationsDone = 0;
        }
      );

      function scheduleInvitation(invitee) {
        const i = currentInvitationId++;
        // We wait 350ms between invitations to avoid rate limitation errors
        // @TODO we need a backend endpoint for batch invitation:
        // https://contentful.tpondemand.com/entity/17146
        return $timeout(350 * i).then(() =>
          spaceContext.memberships.invite(invitee.user.email, [invitee.roleId]).then(() => {
            $scope.invitationsDone++;
            $scope.users = _.without($scope.users, invitee.user);
          })
        );
      }
    }
  }
]);
