import modalDialog from 'modalDialog';
import $rootScope from '$rootScope';
import $q from '$q';
import Command from 'command';
import notification from 'notification';
import stringUtils from 'stringUtils';
import ListQuery from 'ListQuery';
import entitySelector from 'entitySelector';
import { get, includes, extend, map, isString } from 'lodash';
import UserSpaceInvitationNoUsersMessage from 'access_control/templates/UserSpaceInvitationNoUsersMessage';
import UserSpaceInvitationDialog from 'access_control/templates/UserSpaceInvitationDialog';

const MODAL_OPTS_BASE = {
  noNewScope: true,
  ignoreEsc: true,
  backgroundClose: false
};

export function create (spaceContext, userListHandler) {
  return {
    openRemovalConfirmationDialog: openRemovalConfirmationDialog,
    openRoleChangeDialog: openRoleChangeDialog,
    openOldInvitationDialog: openOldInvitationDialog,
    openSpaceInvitationDialog: openSpaceInvitationDialog
  };

  /**
   * Remove a user from a space
   */
  function openRemovalConfirmationDialog (user) {
    const templateName = userListHandler.isLastAdmin(user.id)
      ? 'admin_removal_confirm_dialog'
      : 'user_removal_confirm_dialog';

    const scope = $rootScope.$new();

    extend(scope, {
      user: user,
      input: {},
      removeUser: Command.create(function () {
        return spaceContext.memberships.remove(user.membership)
        .then(function () {
          notification.info('User successfully removed from this space.');
        })
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: isDisabled
      })
    });

    return modalDialog.open(extend({
      template: templateName,
      scope: scope
    }, MODAL_OPTS_BASE)).promise;

    function isDisabled () {
      return userListHandler.isLastAdmin(user.id) && scope.input.confirm !== 'I UNDERSTAND';
    }
  }

  /**
   * Change a role of an user
   */
  function openRoleChangeDialog (user) {
    const scope = $rootScope.$new();

    extend(scope, {
      user: user,
      startsWithVowel: stringUtils.startsWithVowel,
      input: {},
      roleOptions: userListHandler.getRoleOptions(),
      changeRole: Command.create(function () {
        return spaceContext.memberships.changeRoleTo(user.membership, scope.input.id)
        .then(function () {
          notification.info('User role successfully changed.');
        })
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: function () { return !scope.input.id; }
      })
    });

    return modalDialog.open(extend({
      template: 'role_change_dialog',
      scope: scope
    }, MODAL_OPTS_BASE)).promise;
  }

  /**
   * Send an invitation
   * @TODO remove after feature-bv-04-2017-new-space-invitation-flow is released
   */
  function openOldInvitationDialog () {
    return modalDialog.open(extend({
      template: 'invitation_dialog',
      scope: prepareInvitationDialogScope()
    }, MODAL_OPTS_BASE)).promise;

    function prepareInvitationDialogScope () {
      const scope = $rootScope.$new();

      return extend(scope, {
        input: {},
        roleOptions: userListHandler.getRoleOptions(),
        invite: Command.create(function () {
          return invite(scope.input)
          .then(handleSuccess, handleFailure);
        }, {
          disabled: isDisabled
        })
      });

      function invite (data) {
        return spaceContext.memberships.invite(data.mail, data.roleId);
      }

      function handleSuccess () {
        notification.info('Invitation successfully sent.');
        scope.dialog.confirm();
      }

      function handleFailure (res) {
        if (isTaken(res)) {
          scope.taken = scope.input.mail;
          scope.backendMessage = null;
        } else if (isForbidden(res)) {
          scope.taken = null;
          scope.backendMessage = res.data.message;
        } else {
          scope.dialog.confirm();
          return $q.reject;
        }
      }

      function isTaken (res) {
        const errors = get(res, 'data.details.errors', []);
        const errorNames = map(errors, 'name');
        return errorNames.indexOf('taken') > -1;
      }

      function isForbidden (res) {
        return (
          get(res, 'data.sys.id') === 'Forbidden' &&
          isString(get(res, 'data.message'))
        );
      }

      function isDisabled () {
        return !scope.invitationForm.$valid || !scope.input.roleId;
      }
    }
  }

  // Begin feature flag code - feature-bv-04-2017-new-space-invitation-flow

  /**
   * Invite an existing user to space
   */
  function openSpaceInvitationDialog (goToOrganizationUsers, canInviteUsersToOrganization) {
    const labels = {
      title: 'Add users to space',
      insert: 'Assign roles to selected users',
      infoHtml: JST.users_add_note(), // @TODO use hyperscript
      noEntitiesCustomHtml: UserSpaceInvitationNoUsersMessage()
    };

    return entitySelector.open({
      entityType: 'User',
      fetch: fetchUsers,
      multiple: true,
      min: 1,
      max: Infinity,
      labels: labels,
      scope: {
        goToOrganizationUsers: goToOrganizationUsers,
        canInviteUsersToOrganization: canInviteUsersToOrganization
      }
    })
    .then(function (result) {
      return modalDialog.open({
        template: UserSpaceInvitationDialog(),
        backgroundClose: false,
        ignoreEsc: true,
        noNewScope: true,
        scopeData: {
          users: result,
          roleOptions: userListHandler.getRoleOptions(),
          selectedRoles: {}
        }
      }).promise;
    })
    .then(function () {
      notification.info('Invitations successfully sent.');
    });

    function fetchUsers (params) {
      return ListQuery.getForUsers(params).then(function (query) {
        return spaceContext.organizationContext.getAllUsers(query);
      }).then(function (organizationUsers) {
        const spaceUserIds = userListHandler.getUserIds();
        const displayedUsers = organizationUsers.filter(function (item) {
          const id = get(item, 'sys.id');
          return id && !includes(spaceUserIds, id);
        });
        return { items: displayedUsers, total: displayedUsers.length };
      });
    }
  }

  // End feature flag code - feature-bv-04-2017-new-space-invitation-flow

}
