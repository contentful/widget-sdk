import modalDialog from 'modalDialog';
import $rootScope from '$rootScope';
import Command from 'command';
import notification from 'notification';
import ReloadNotification from 'ReloadNotification';
import stringUtils from 'stringUtils';

const MODAL_OPTS_BASE = {
  noNewScope: true,
  ignoreEsc: true,
  backgroundClose: false
};

export function create (spaceContext, userListHandler) {
  return {
    openRemovalConfirmationDialog: openRemovalConfirmationDialog,
    openRoleChangeDialog: openRoleChangeDialog
  };

  /**
   * Remove a user from a space
   */
  function openRemovalConfirmationDialog (user) {
    const templateName = userListHandler.isLastAdmin(user.id) ?
      'admin_removal_confirm_dialog' :
      'user_removal_confirm_dialog';

    const scope = $rootScope.$new();

    _.extend(scope, {
      user: user,
      input: {},
      removeUser: Command.create(function () {
        return spaceContext.memberships.remove(user.membership)
        .then(function () {
          notification.info('User successfully removed from this space.');
        })
        .catch(ReloadNotification.basicErrorHandler)
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: isDisabled
      })
    });

    return modalDialog.open(_.extend({
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

    _.extend(scope, {
      user: user,
      startsWithVowel: stringUtils.startsWithVowel,
      input: {},
      roleOptions: userListHandler.getRoleOptions(),
      changeRole: Command.create(function () {
        return spaceContext.memberships.changeRoleTo(user.membership, scope.input.id)
        .then(function () {
          notification.info('User role successfully changed.');
        })
        .catch(ReloadNotification.basicErrorHandler)
        .finally(function () { scope.dialog.confirm(); });
      }, {
        disabled: function () { return !scope.input.id; }
      })
    });

    return modalDialog.open(_.extend({
      template: 'role_change_dialog',
      scope: scope
    }, MODAL_OPTS_BASE)).promise;
  }

}
