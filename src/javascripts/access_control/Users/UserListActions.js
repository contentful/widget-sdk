import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { find, map, isEmpty } from 'lodash';

import ReloadNotification from 'app/common/ReloadNotification';
import { getModule } from 'NgRegistry';
import ModalLauncher from 'app/common/ModalLauncher';
import * as TokenStore from 'services/TokenStore';
import { go } from 'states/Navigator';

import { ADMIN_ROLE_ID } from '../constants';

import RoleChangeDialog from './RoleChangeDialog';
import UserRemovalConfirmDialog from './UserRemovalConfirmDialog';
import LastAdminRemovalConfirmDialog from './LastAdminRemovalConfirmDialog';

const getDisplayName = ({ firstName, lastName, email }) =>
  firstName || lastName ? `${firstName} ${lastName}` : email;

const isLastAdmin = (member, adminCount) => !!member.admin && adminCount === 1;

/**
 * Creates a instance of actions used in space users list view to open the following dialogs:
 *
 * - `.openRemovalConfirmationDialog()` remove a user from space
 * - `.openRoleChangeDialog()` change user's role
 */
export function create(availableRoles) {
  return {
    openRemovalConfirmationDialog,
    openRoleChangeDialog,
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
        const spaceMembership = find(member.sys.relatedMemberships, {
          sys: { type: 'SpaceMembership' },
        });
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
      sys: { user, relatedMemberships },
      roles,
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
}
