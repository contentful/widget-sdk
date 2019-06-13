import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as stringUtils from 'utils/StringUtils.es6';
import { go } from 'states/Navigator.es6';
import { get, includes, extend } from 'lodash';
import UserSpaceInvitationDialog from 'access_control/templates/UserSpaceInvitationDialog.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository.es6';
import { getModule } from 'NgRegistry.es6';

const modalDialog = getModule('modalDialog');
const Command = getModule('command');
const ListQuery = getModule('ListQuery');
const entitySelector = getModule('entitySelector');

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
export function create(spaceContext, userListHandler, TokenStore) {
  return {
    openRemovalConfirmationDialog,
    openRoleChangeDialog,
    openSpaceInvitationDialog
  };

  /**
   * Remove a user from a space
   */
  function openRemovalConfirmationDialog(user) {
    const templateName = userListHandler.isLastAdmin(user.id)
      ? 'admin_removal_confirm_dialog'
      : 'user_removal_confirm_dialog';

    const currentUserId = spaceContext.getData('spaceMember.sys.user.sys.id');
    const isCurrentUser = currentUserId === user.id;

    return openDialog(templateName, controller);

    function controller(scope) {
      extend(scope, {
        user,
        input: {},
        removeUser: Command.create(
          () =>
            spaceContext.memberships
              .remove(user.membership)
              .then(() => {
                Notification.success('User successfully removed from this space.');
                if (isCurrentUser) {
                  TokenStore.refresh().then(() => go({ path: ['home'] }));
                }
              })
              .catch(ReloadNotification.basicErrorHandler)
              .finally(() => {
                scope.dialog.confirm();
              }),
          {
            disabled: isDisabled
          }
        )
      });

      function isDisabled() {
        return userListHandler.isLastAdmin(user.id) && scope.input.confirm !== 'I UNDERSTAND';
      }
    }
  }

  /**
   * Change a role of an user
   */
  function openRoleChangeDialog(user) {
    return openDialog('role_change_dialog', controller);

    function controller(scope) {
      extend(scope, {
        user,
        startsWithVowel: stringUtils.startsWithVowel,
        input: {},
        roleOptions: userListHandler.getRoleOptions(),
        changeRole: Command.create(
          () =>
            spaceContext.memberships
              .changeRoleTo(user.spaceMembership, [scope.input.id])
              .then(() => {
                Notification.success('User role successfully changed.');
              })
              .catch(ReloadNotification.basicErrorHandler)
              .finally(() => {
                scope.dialog.confirm();
              }),
          {
            disabled: function() {
              return !scope.input.id;
            }
          }
        )
      });
    }
  }

  /**
   * Invite an existing user to space
   */
  function openSpaceInvitationDialog() {
    const labels = {
      title: 'Add users to space',
      insert: 'Assign roles to selected users',
      infoHtml: '<cf-add-users-to-space-note></cf-add-users-to-space-note>',
      noEntitiesCustomHtml:
        '<cf-no-users-to-add-to-space-dialog></cf-no-users-to-add-to-space-dialog>'
    };

    return entitySelector
      .open({
        entityType: 'User',
        fetch: fetchUsers,
        multiple: true,
        min: 1,
        max: Infinity,
        labels,
        // since in `fetchUsers` we download all existing users
        // for the current query, there is no need to fetch more
        // after we reach bottom of the page
        noPagination: true
      })
      .then(result => {
        return openDialog(UserSpaceInvitationDialog(), controller);

        function controller(scope) {
          extend(scope, {
            users: result,
            roleOptions: userListHandler.getRoleOptions(),
            selectedRoles: {},
            goBackToSelection: function() {
              openSpaceInvitationDialog();
              scope.dialog.confirm();
            }
          });
        }
      })
      .then(() => {
        Notification.success('Invitations successfully sent.');
      });

    function fetchUsers(params) {
      return ListQuery.getForUsers(params)
        .then(query => {
          const orgId = spaceContext.organization.sys.id;
          const endpoint = createOrganizationEndpoint(orgId);
          return getAllUsers(endpoint, query);
        })
        .then(organizationUsers => {
          const spaceUserIds = userListHandler.getUserIds();
          const displayedUsers = organizationUsers.filter(item => {
            const id = get(item, 'sys.id');
            return id && !includes(spaceUserIds, id);
          });
          return { items: displayedUsers, total: displayedUsers.length };
        });
    }
  }

  function openDialog(template, controller) {
    return modalDialog.open(
      extend(
        {
          template,
          controller
        },
        MODAL_OPTS_BASE
      )
    ).promise;
  }
}
