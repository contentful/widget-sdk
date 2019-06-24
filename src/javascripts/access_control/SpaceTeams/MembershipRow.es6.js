import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TableCell, TableRow } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { cx, css } from 'emotion';
import { truncate, map, intersection, isEmpty, set } from 'lodash';

import { joinWithAnd } from 'utils/StringUtils.es6';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor.es6';
import {
  SpaceRole as SpaceRoleProp,
  TeamSpaceMembership as TeamSpaceMembershipProp
} from 'app/OrganizationSettings/PropTypes.es6';
import { ADMIN_ROLE, ADMIN_ROLE_ID } from 'access_control/constants.es6';

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
  isPending
}) => {
  const [persistedMembership, setPersistedMembership] = useState(membership);
  const {
    sys: {
      id: membershipId,
      team: { name, description, memberCount }
    },
    roles
  } = persistedMembership;

  const [persistedRoles, setPersistedRoles] = useState(isEmpty(roles) ? [ADMIN_ROLE] : roles);
  const persistedRoleIds = map(persistedRoles, 'sys.id');
  const [selectedRoleIds, setSelectedRoles] = useState(persistedRoleIds);
  const haveRolesChanged = !(
    intersection(selectedRoleIds, persistedRoleIds).length === selectedRoleIds.length &&
    selectedRoleIds.length === persistedRoleIds.length
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
              onChange={setSelectedRoles}
              options={availableRoles}
              value={selectedRoleIds}
            />
            <span className={css({ flexGrow: 1 })} />
            <Button
              buttonType="positive"
              onClick={async () => {
                const newRoles = availableRoles.filter(({ sys: { id } }) =>
                  selectedRoleIds.includes(id)
                );
                const updatedMembership = await onUpdateTeamSpaceMembership(
                  persistedMembership,
                  selectedRoleIds[0] === ADMIN_ROLE_ID,
                  newRoles.map(({ sys: { id } }) => ({
                    sys: { id, type: 'Link', linkType: 'Role' }
                  }))
                );
                setPersistedMembership(
                  set(membership, 'sys.version', updatedMembership.sys.version)
                );
                setPersistedRoles(isEmpty(newRoles) ? [ADMIN_ROLE] : newRoles);
              }}
              className={css({ marginRight: tokens.spacingM })}
              disabled={!haveRolesChanged || isPending}
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
            {persistedRoles.includes(ADMIN_ROLE)
              ? 'Admin'
              : joinWithAnd(map(persistedRoles, 'name'))}
          </TableCell>
          <TableCell>
            <RowMenu isOpen={menuIsOpen} setOpen={setMenuOpen} setEditing={setEditing} />
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
  isPending: PropTypes.bool.isRequired
};

export default MembershipRow;
