import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  TableCell,
  TableRow,
  Tooltip,
  ModalConfirm
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { cx, css } from 'emotion';
import { truncate, map, intersection, isEmpty } from 'lodash';

import { joinWithAnd } from 'utils/StringUtils.es6';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor.es6';
import {
  SpaceMembership as SpaceMembershipProp,
  SpaceRole as SpaceRoleProp,
  TeamSpaceMembership as TeamSpaceMembershipProp
} from 'app/OrganizationSettings/PropTypes.es6';
import { ADMIN_ROLE } from 'access_control/constants.es6';
import { href } from 'states/Navigator.es6';

import RowMenu from './RowMenu.es6';
import styles from '../styles.es6';
import DowngradeOwnAdminMembershipConfirmation from './DowngradeOwnAdminMembershipConfirmation.es6';
import RemoveOwnAdminMembershipConfirmation from './RemoveOwnAdminMembershipConfirmation.es6';

const navigateToDefaultLocation = () => window.location.replace(href({ path: ['^', '^'] }));

const MembershipRow = ({
  membership,
  availableRoles,
  menuIsOpen,
  setMenuOpen,
  isEditing,
  setEditing,
  onRemoveTeamSpaceMembership,
  onUpdateTeamSpaceMembership,
  isPending,
  readOnly,
  currentUserAdminSpaceMemberships
}) => {
  const {
    sys: {
      id: membershipId,
      team: { name, description, memberCount }
    },
    roles
  } = membership;

  const roleIds = map(isEmpty(roles) ? [ADMIN_ROLE] : roles, 'sys.id');
  const [selectedRoleIds, setSelectedRoles] = useState(roleIds);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [showRemoveOwnAdminConfirmation, setShowRemoveOwnAdminConfirmation] = useState(false);

  const isLastAdminMembership =
    currentUserAdminSpaceMemberships.length === 1 &&
    currentUserAdminSpaceMemberships[0].sys.id === membershipId;

  const haveRolesChanged = !(
    intersection(selectedRoleIds, roleIds).length === selectedRoleIds.length &&
    selectedRoleIds.length === roleIds.length
  );

  const onUpdateConfirmed = useCallback(
    async (lostAccess = false) => {
      try {
        await onUpdateTeamSpaceMembership(membership, selectedRoleIds);
        if (lostAccess) {
          navigateToDefaultLocation();
        }
      } catch (e) {
        setSelectedRoles(roleIds);
        throw e;
      }
    },
    [membership, onUpdateTeamSpaceMembership, roleIds, selectedRoleIds]
  );

  const onUpdate = useCallback(async () => {
    if (isLastAdminMembership) {
      setShowUpdateConfirmation(true);
      return;
    }
    await onUpdateConfirmed();
  }, [isLastAdminMembership, onUpdateConfirmed]);

  const onRemove = useCallback(() => {
    if (isLastAdminMembership) {
      setShowRemoveOwnAdminConfirmation(true);
    } else {
      setShowRemoveConfirmation(true);
    }
  }, [isLastAdminMembership]);

  const onRemoveConfirmed = useCallback(
    async (lostAccess = false) => {
      await onRemoveTeamSpaceMembership(membership, selectedRoleIds);
      if (lostAccess) {
        navigateToDefaultLocation();
      }
    },
    [membership, onRemoveTeamSpaceMembership, selectedRoleIds]
  );

  // reset selected roles when starting to edit
  useEffect(() => {
    !isEditing && setSelectedRoles(roleIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const confirmButton = (
    <Button
      testId="confirm-change-role"
      buttonType="positive"
      onClick={onUpdate}
      className={css({ marginRight: tokens.spacingM })}
      disabled={!haveRolesChanged || isEmpty(selectedRoleIds) || isPending}
      loading={isPending}>
      Change role
    </Button>
  );

  return (
    <TableRow key={membershipId} testId="membership-row" className={styles.row}>
      <DowngradeOwnAdminMembershipConfirmation
        isShown={showUpdateConfirmation}
        close={() => setShowUpdateConfirmation(false)}
        onConfirm={() => {
          setShowUpdateConfirmation(false);
          onUpdateConfirmed(true);
        }}
        teamName={name}
      />
      <RemoveOwnAdminMembershipConfirmation
        isShown={showRemoveOwnAdminConfirmation}
        close={() => setShowRemoveOwnAdminConfirmation(false)}
        onConfirm={() => {
          setShowRemoveOwnAdminConfirmation(false);
          onRemoveConfirmed(true);
        }}
        teamName={name}
      />
      <ModalConfirm
        testId="remove-team-confirmation"
        onCancel={() => setShowRemoveConfirmation(false)}
        onConfirm={() => {
          setShowRemoveConfirmation(false);
          onRemoveConfirmed();
        }}
        isShown={showRemoveConfirmation}
        intent="negative"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        title="Remove team from this space">
        <p>
          Are you sure you want to remove {<strong className={styles.strong}>{name}</strong>} from
          this space?
        </p>
      </ModalConfirm>
      <TableCell className={styles.cell} testId="team-cell">
        <div className={styles.cellTeamName} data-test-id="team.name">
          {name}
        </div>
        {/*This truncation is a fallback for IE and pre-68 FF, which don't support css line-clamp*/}
        <div className={styles.cellTeamDescription} data-test-id="team.description">
          {truncate(description, { length: 130 })}
        </div>
      </TableCell>
      {isEditing ? (
        <TableCell colSpan={3}>
          <div className={styles.roleForm}>
            <SpaceRoleEditor
              buttonProps={{ className: styles.roleEditorButton }}
              onChange={setSelectedRoles}
              options={availableRoles}
              value={selectedRoleIds}
            />
            {!haveRolesChanged && (
              <Tooltip content="Please change at least one role to be able to save">
                {confirmButton}
              </Tooltip>
            )}
            {isEmpty(selectedRoleIds) && (
              <Tooltip content="Please select at least one role to assign to this team">
                {confirmButton}
              </Tooltip>
            )}
            {haveRolesChanged && !isEmpty(selectedRoleIds) && confirmButton}
            <Button buttonType="muted" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </TableCell>
      ) : (
        <>
          <TableCell className={styles.cell} testId="member-count-cell">
            {pluralize('member', memberCount, true)}
          </TableCell>
          <TableCell className={cx(styles.cellRoles, styles.cell)} testId="roles-cell">
            {isEmpty(roles) ? 'Admin' : joinWithAnd(map(roles, 'name'))}
          </TableCell>
          <TableCell>
            {!readOnly && (
              <RowMenu
                isOpen={menuIsOpen}
                setOpen={setMenuOpen}
                setEditing={setEditing}
                onRemove={onRemove}
              />
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

MembershipRow.propTypes = {
  membership: TeamSpaceMembershipProp.isRequired,
  availableRoles: PropTypes.arrayOf(SpaceRoleProp).isRequired,
  menuIsOpen: PropTypes.bool.isRequired,
  setMenuOpen: PropTypes.func.isRequired,
  isEditing: PropTypes.bool.isRequired,
  setEditing: PropTypes.func.isRequired,
  onUpdateTeamSpaceMembership: PropTypes.func.isRequired,
  onRemoveTeamSpaceMembership: PropTypes.func.isRequired,
  isPending: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired,
  currentUserAdminSpaceMemberships: PropTypes.arrayOf(
    PropTypes.oneOfType([SpaceMembershipProp, TeamSpaceMembershipProp])
  ).isRequired
};

export default MembershipRow;
