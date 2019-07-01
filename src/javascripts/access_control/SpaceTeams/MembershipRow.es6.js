import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TableCell, TableRow } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { cx, css } from 'emotion';
import { truncate, map, intersection, isEmpty } from 'lodash';

import { joinWithAnd } from 'utils/StringUtils.es6';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor.es6';
import {
  SpaceRole as SpaceRoleProp,
  TeamSpaceMembership as TeamSpaceMembershipProp
} from 'app/OrganizationSettings/PropTypes.es6';
import { ADMIN_ROLE } from 'access_control/constants.es6';

import RowMenu from './RowMenu.es6';
import styles from './styles.es6';

const MembershipRow = ({
  membership,
  availableRoles,
  menuIsOpen,
  setMenuOpen,
  isEditing,
  setEditing,
  onUpdateTeamSpaceMembership,
  isPending,
  readOnly
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

  // reset selected roles when starting to edit
  useEffect(() => {
    !isEditing && setSelectedRoles(roleIds);
  }, [isEditing, roleIds]);

  const haveRolesChanged = !(
    intersection(selectedRoleIds, roleIds).length === selectedRoleIds.length &&
    selectedRoleIds.length === roleIds.length
  );

  return (
    <TableRow key={membershipId} testId="membership-row" className={styles.row}>
      <TableCell className={styles.cell} testId="team-cell">
        <div className={styles.cellTeamName}>{name}</div>
        {/*This truncation is a fallback for IE and pre-68 FF, which don't support css line-clamp*/}
        <div className={styles.cellTeamDescription}>{truncate(description, { length: 130 })}</div>
      </TableCell>
      <TableCell className={styles.cell} testId="member-count-cell">
        {pluralize('member', memberCount, true)}
      </TableCell>
      {isEditing ? (
        <TableCell colSpan={2}>
          <div className={css({ display: 'flex' })}>
            <SpaceRoleEditor
              buttonProps={{ className: styles.roleEditorButton }}
              onChange={setSelectedRoles}
              options={availableRoles}
              value={selectedRoleIds}
            />
            <span className={css({ flexGrow: 1 })} />
            <Button
              testId="confirm-change-role"
              buttonType="positive"
              onClick={async () => {
                try {
                  await onUpdateTeamSpaceMembership(membership, selectedRoleIds);
                } catch (e) {
                  setSelectedRoles(roleIds);
                }
              }}
              className={css({ marginRight: tokens.spacingM })}
              disabled={!haveRolesChanged || isEmpty(selectedRoleIds) || isPending}
              loading={isPending}>
              Change role
            </Button>
            <Button buttonType="muted" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </TableCell>
      ) : (
        <>
          <TableCell className={cx(styles.cellRoles, styles.cell)} testId="roles-cell">
            {isEmpty(roles) ? 'Admin' : joinWithAnd(map(roles, 'name'))}
          </TableCell>
          <TableCell>
            {!readOnly && (
              <RowMenu isOpen={menuIsOpen} setOpen={setMenuOpen} setEditing={setEditing} />
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
  isPending: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired
};

export default MembershipRow;
