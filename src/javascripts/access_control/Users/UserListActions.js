import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { get, includes, extend, filter, map, isEmpty } from 'lodash';

import ReloadNotification from 'app/common/ReloadNotification.es6';
import UserSpaceInvitationDialog from 'access_control/templates/UserSpaceInvitationDialog';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository';
import { getModule } from 'NgRegistry.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import * as ListQuery from 'search/listQuery.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { go } from 'states/Navigator.es6';
import * as entitySelector from 'search/EntitySelector/entitySelector.es6';

import { ADMIN_ROLE_ID } from '../constants';

import RoleChangeDialog from './RoleChangeDialog';
import UserRemovalConfirmDialog from './UserRemovalConfirmDialog';
import LastAdminRemovalConfirmDialog from './LastAdminRemovalConfirmDialog';

const MODAL_OPTS_BASE = {
  noNewScope: true,
  ignoreEsc: true,
  backgroundClose: false
};

const getDisplayName = ({ firstName, lastName, email }) =>
  firstName || lastName ? `${firstName} ${lastName}` : email;

const isLastAdmin = (member, adminCount) => !!member.admin && adminCount === 1;

/**
 * Creates a instance of actions used in space users list view to open the following dialogs:
 *
 * - `.openRemovalConfirmationDialog()` remove a user from space
 * - `.openRoleChangeDialog()` change user's role
 * - `.openSpaceInvitationDialog()` invite users to the space from a list of organization's users
 */
export function create(availableRoles, spaceUsers) {
  const spaceContext = getModule('spaceContext');
  const modalDialog = getModule('modalDialog');
  const roleOptions = [
    { id: ADMIN_ROLE_ID, name: 'Administrator' },
    ...availableRoles.map(({ sys: { id }, name }) => ({ id, name }))
  ];
  const spaceUserIds = map(spaceUsers, 'sys.id');

  return {
    openRemovalConfirmationDialog,
    openRoleChangeDialog,
    openSpaceInvitationDialog
  };

  /**
   * Remove a user from a space
   */
  function openRemovalConfirmationDialog(fetch) {
    return async (member, adminCount) => {
      const ConfirmDialog = isLastAdmin(member, adminCount)
        ? LastAdminRemovalConfirmDialog
        : UserRemovalConfirmDialog;
      const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
        <ConfirmDialog
          displayName={getDisplayName(member.sys.user)}
          isShown={isShown}
          onClose={onClose}
        />
      ));

      if (confirmed) {
        const spaceContext = getModule('spaceContext');
        const currentUserId = spaceContext.getData('spaceMember.sys.user.sys.id');
        const isCurrentUser = currentUserId === member.sys.user.sys.id;
        const spaceMembership = filter(member.relatedMemberships, {
          sys: { type: 'SpaceMembership' }
        })[0];
        return spaceContext.memberships
          .remove(spaceMembership)
          .then(() => {
            Notification.success('User successfully removed from this space.');
            if (isCurrentUser) {
              TokenStore.refresh().then(() => go({ path: ['home'] }));
            } else {
              fetch();
            }
          })
          .catch(ReloadNotification.basicErrorHandler);
      }
      return Promise.resolve();
    };
  }

  /**
   * Change a role of an user
   */
  async function openRoleChangeDialog(member, adminCount) {
    const {
      sys: { user },
      roles,
      relatedMemberships
    } = member;

    const uniqueModalKey = Date.now();

    const selectedRoleIds = await ModalLauncher.open(({ isShown, onClose }) => (
      <RoleChangeDialog
        key={uniqueModalKey}
        availableRoles={availableRoles}
        displayName={getDisplayName(user)}
        isShown={isShown}
        initiallySelectedRoleIds={map(roles, 'sys.id')}
        onClose={onClose}
        isLastAdmin={isLastAdmin(member, adminCount)}
      />
    ));

    if (selectedRoleIds !== false) {
      const spaceMembership = relatedMemberships.filter(
        ({ sys: { type } }) => type === 'SpaceMembership'
      )[0];
      const spaceContext = getModule('spaceContext');
      return spaceContext.memberships
        .changeRoleTo(spaceMembership, isEmpty(selectedRoleIds) ? [ADMIN_ROLE_ID] : selectedRoleIds)
        .then(() => {
          Notification.success('User role successfully changed.');
        })
        .catch(ReloadNotification.basicErrorHandler);
    }
    return Promise.resolve();
  }

  /**
   * Invite an existing user to space
   */
  function openSpaceInvitationDialog() {
    return () => {
      const canAddUsers = isOwnerOrAdmin(spaceContext.organization);
      const labels = {
        title: 'Add users to space',
        insert: 'Assign roles to selected users',
        infoHtml: `<react-component name="access_control/AddUsersToSpaceNote"  props="{isOwnerOrAdmin: ${canAddUsers}}" />`,
        noEntitiesCustomHtml: `<react-component name="access_control/NoUsersToAddNote"  props="{isOwnerOrAdmin: ${canAddUsers}}" />`
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
              roleOptions: roleOptions,
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
            const displayedUsers = organizationUsers.filter(item => {
              const id = get(item, 'sys.id');
              return id && !includes(spaceUserIds, id);
            });
            return { items: displayedUsers, total: displayedUsers.length };
          });
      }
    };
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
