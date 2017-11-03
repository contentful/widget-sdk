import modalDialog from 'modalDialog';
import Command from 'command';
import notification from 'notification';
import ReloadNotification from 'ReloadNotification';
import stringUtils from 'stringUtils';
import ListQuery from 'ListQuery';
import entitySelector from 'entitySelector';
import { go } from 'states/Navigator';
import { get, includes, extend } from 'lodash';
import UserSpaceInvitationDialog from 'access_control/templates/UserSpaceInvitationDialog';

const MODAL_OPTS_BASE = {
  noNewScope: true,
  ignoreEsc: true,
  backgroundClose: false
};

/**
 * Creates a instance of actions used in space users list view to open the following dialogs:
 *
 * - `.openRemovalConfirmationDialog()` remove a user from space
 * - `.openRoleChangeDialog()` change user's role
 * - `.openSpaceInvitationDialog()` invite users to the space from a list of organization's users
 */
export function create (spaceContext, userListHandler, TokenStore) {
  return {
    openRemovalConfirmationDialog: openRemovalConfirmationDialog,
    openRoleChangeDialog: openRoleChangeDialog,
    openSpaceInvitationDialog: openSpaceInvitationDialog
  };

  /**
   * Remove a user from a space
   */
  function openRemovalConfirmationDialog (user) {
    const templateName = userListHandler.isLastAdmin(user.id)
      ? 'admin_removal_confirm_dialog'
      : 'user_removal_confirm_dialog';

    const currentUserId = spaceContext.getData('spaceMembership.user.sys.id');
    const isCurrentUser = currentUserId === user.id;

    return openDialog(templateName, controller);

    function controller (scope) {
      extend(scope, {
        user: user,
        input: {},
        removeUser: Command.create(function () {
          return spaceContext.memberships.remove(user.membership)
          .then(function () {
            notification.info('User successfully removed from this space.');
            if (isCurrentUser) {
              TokenStore.refresh().then(() => go({ path: ['home'] }));
            }
          })
          .catch(ReloadNotification.basicErrorHandler)
          .finally(function () { scope.dialog.confirm(); });
        }, {
          disabled: isDisabled
        })
      });

      function isDisabled () {
        return userListHandler.isLastAdmin(user.id) && scope.input.confirm !== 'I UNDERSTAND';
      }
    }
  }

  /**
   * Change a role of an user
   */
  function openRoleChangeDialog (user) {
    return openDialog('role_change_dialog', controller);

    function controller (scope) {
      extend(scope, {
        user: user,
        startsWithVowel: stringUtils.startsWithVowel,
        input: {},
        roleOptions: userListHandler.getRoleOptions(),
        changeRole: Command.create(function () {
          return spaceContext.memberships.changeRoleTo(user.membership, [scope.input.id])
          .then(function () {
            notification.info('User role successfully changed.');
          })
          .catch(ReloadNotification.basicErrorHandler)
          .finally(function () { scope.dialog.confirm(); });
        }, {
          disabled: function () { return !scope.input.id; }
        })
      });
    }
  }

  /**
   * Invite an existing user to space
   */
  function openSpaceInvitationDialog () {
    const labels = {
      title: 'Add users to space',
      insert: 'Assign roles to selected users',
      infoHtml: '<cf-add-users-to-space-note></cf-add-users-to-space-note>',
      noEntitiesCustomHtml: '<cf-no-users-to-add-to-space-dialog></cf-no-users-to-add-to-space-dialog>'
    };

    return entitySelector.open({
      entityType: 'User',
      fetch: fetchUsers,
      multiple: true,
      min: 1,
      max: Infinity,
      labels: labels
    })
    .then(function (result) {
      return openDialog(UserSpaceInvitationDialog(), controller);

      function controller (scope) {
        extend(scope, {
          users: result,
          roleOptions: userListHandler.getRoleOptions(),
          selectedRoles: {},
          goBackToSelection: function () {
            openSpaceInvitationDialog();
            scope.dialog.confirm();
          }
        });
      }
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

  function openDialog (template, controller) {
    return modalDialog.open(extend({
      template: template,
      controller: controller
    }, MODAL_OPTS_BASE)).promise;
  }
}
