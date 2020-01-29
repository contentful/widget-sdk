import { registerController } from 'NgRegistry';
import _ from 'lodash';
import { track } from 'analytics/Analytics';

export default function register() {
  /**
   * @ngdoc type
   * @name UserSpaceInvitationController
   *
   * @scope.requires {Array} users
   * @scope.requires {Array} roleOptions - available role options in the format of { id, name }
   * @scope.requires {modalDialog} dialog
   * @scope.requires {fn} goBackToSelection - fn to go back to the previous step
   */
  registerController('UserSpaceInvitationController', [
    '$scope',
    '$q',
    '$timeout',
    'spaceContext',
    function UserSpaceInvitationController($scope, $q, $timeout, spaceContext) {
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

      async function inviteUsers() {
        $scope.hasFailedInvitations = false;
        $scope.invitationsScheduled = $scope.users.length;
        $scope.invitationsDone = 0;

        const invitees = $scope.users.map(user => ({
          user,
          roleId: $scope.selectedRoles[user.sys.id]
        }));
        let currentInvitationId = 0;
        let failedInvites = 0;

        const promises = invitees.map(invitee =>
          scheduleInvitation(invitee).catch(() => (failedInvites += 1))
        );

        await Promise.all(promises);

        if (failedInvites === 0) {
          $scope.dialog.confirm();
        } else {
          $scope.hasFailedInvitations = true;
          $scope.invitationsScheduled = 0;
          $scope.invitationsDone = 0;
        }

        track('teams_in_space:users_added', {
          numErr: failedInvites,
          numSuccess: invitees.length - failedInvites
        });

        function scheduleInvitation(invitee) {
          const i = currentInvitationId;
          currentInvitationId = currentInvitationId + 1;
          // We wait 350ms between invitations to avoid rate limitation errors
          // @TODO we need a backend endpoint for batch invitation:
          // https://contentful.tpondemand.com/entity/17146
          return $timeout(350 * i).then(() =>
            spaceContext.memberships.invite(invitee.user.email, [invitee.roleId]).then(() => {
              $scope.invitationsDone = $scope.invitationsDone + 1;
              $scope.users = _.without($scope.users, invitee.user);
            })
          );
        }
      }
    }
  ]);
}
