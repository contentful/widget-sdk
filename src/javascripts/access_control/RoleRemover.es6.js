import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import { getInstance } from 'access_control/RoleRepository.es6';

registerFactory('createRoleRemover', [
  '$q',
  '$rootScope',
  'modalDialog',
  'command',
  'spaceContext',
  ($q, $rootScope, modalDialog, Command, spaceContext) => {
    const roleRepo = getInstance(spaceContext.space);

    return function createRoleRemover(listHandler, doneFn) {
      return function removeRole(role) {
        modalDialog.open({
          template: 'role_removal_dialog',
          noNewScope: true,
          ignoreEsc: true,
          backgroundClose: false,
          scope: prepareRemovalDialogScope(role, remove)
        });

        function remove() {
          return roleRepo
            .remove(role)
            .then(doneFn)
            .then(() => {
              Notification.success('Role successfully deleted.');
            })
            .catch(ReloadNotification.basicErrorHandler);
        }
      };

      function prepareRemovalDialogScope(role, remove) {
        const scope = $rootScope.$new();

        return _.extend(scope, {
          role,
          input: {},
          count: getCountFor(role),
          isUsed: getCountFor(role) > 0,
          roleOptions: listHandler.getRoleOptionsBut(role.sys.id),
          moveUsersAndRemoveRole: Command.create(moveUsersAndRemoveRole, {
            disabled: function() {
              return !scope.input.id;
            }
          }),
          removeRole: Command.create(() => remove().finally(() => scope.dialog.confirm()))
        });

        function moveUsersAndRemoveRole() {
          const users = listHandler.getUsersByRole(role.sys.id);
          const memberships = _.map(users, 'membership');
          const moveToRoleId = scope.input.id;

          const promises = _.map(memberships, membership =>
            spaceContext.memberships.changeRoleTo(membership, [moveToRoleId])
          );

          return $q.all(promises).then(
            () =>
              remove().finally(() => {
                scope.dialog.confirm();
              }),
            ReloadNotification.basicErrorHandler
          );
        }
      }

      function getCountFor(role) {
        const counts = listHandler.getMembershipCounts();
        return counts[role.sys.id];
      }
    };
  }
]);
