import * as modalDialog from 'modalDialog';
import $rootScope from '$rootScope';
import * as Command from 'command';
import * as notification from 'notification';
import * as ReloadNotification from 'ReloadNotification';
import * as stringUtils from 'stringUtils';

const MODAL_OPTS_BASE = {
  noNewScope: true,
  ignoreEsc: true,
  backgroundClose: false
};

export function create (spaceContext, userListHandler, reload) {
  return {
    openRemovalConfirmationDialog: openRemovalConfirmationDialog
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
        .then(reload)
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
    }, MODAL_OPTS_BASE));

    function isDisabled () {
      return userListHandler.isLastAdmin(user.id) && scope.input.confirm !== 'I UNDERSTAND';
    }
  }
}
