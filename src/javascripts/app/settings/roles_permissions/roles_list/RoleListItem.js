import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import * as RoleListHandler from 'access_control/RoleListHandler';
import {
  TableRow,
  TableCell,
  Paragraph,
  TextLink,
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import jumpToRoleMembers from 'access_control/Users/jumpToRole';
import { go } from 'states/Navigator.es6';

const styles = {
  clickableCell: css({
    cursor: 'pointer',
    '&:hover > *': {
      color: tokens.colorBlueBase
    }
  }),
  roleName: css({
    fontWeight: tokens.fontWeightDemiBold
  })
};

function jumpToAdminRoleMembers() {
  jumpToRoleMembers(RoleListHandler.ADMIN_ROLE_NAME);
}

function RoleActions(props) {
  const [isOpen, setOpen] = React.useState(false);
  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <IconButton
          testId="role-menu"
          onClick={() => {
            setOpen(true);
          }}
          label="Actions"
          iconProps={{
            icon: 'MoreHorizontal'
          }}
        />
      }>
      <DropdownList>
        <DropdownListItem testId="role-menu-edit" onClick={props.onEdit}>
          Edit
        </DropdownListItem>
        <DropdownListItem testId="role-menu-duplicate" onClick={props.onDuplicate}>
          Duplicate
        </DropdownListItem>
        <DropdownListItem testId="role-menu-delete" onClick={props.onDelete}>
          Delete
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}

RoleActions.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export function AdministratorRoleListItem(props) {
  return (
    <TableRow testId="role-row">
      <TableCell>
        <Paragraph testId="role-name" className={styles.roleName}>
          Administrator
        </Paragraph>
        {props.hasCustomRolesFeature && <Paragraph>(included in space)</Paragraph>}
      </TableCell>
      <TableCell>
        <Paragraph>Members of this role have full access to everything in this space.</Paragraph>
        {props.hasCustomRolesFeature && (
          <Paragraph>
            This role is automatically part of your space and does not count against your role
            limit.
          </Paragraph>
        )}
      </TableCell>
      <TableCell>
        <TextLink onClick={jumpToAdminRoleMembers}>
          {props.count} {props.count !== 1 ? 'members' : 'member'}
        </TextLink>
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

AdministratorRoleListItem.propTypes = {
  count: PropTypes.number.isRequired,
  hasCustomRolesFeature: PropTypes.bool.isRequired
};

export function RoleListItem(props) {
  const openRole = () => {
    go({
      path: '^.detail',
      params: { roleId: props.role.sys.id }
    });
  };

  const deleteRole = () => {
    props.onRemoveRole(props.role);
  };

  const duplicateRole = () => {
    go({ path: '^.new', params: { baseRoleId: props.role.sys.id } });
  };

  return (
    <TableRow testId="role-row">
      <TableCell onClick={openRole} className={styles.clickableCell}>
        <Paragraph testId="role-name" className={styles.roleName}>
          {props.role.name}
        </Paragraph>
      </TableCell>
      <TableCell>
        {props.role.description && <Paragraph>{props.role.description}</Paragraph>}
      </TableCell>
      <TableCell>
        <TextLink
          onClick={() => {
            jumpToRoleMembers(props.role.name);
          }}>
          {props.role.count} {props.role.count !== 1 ? 'members' : 'member'}
        </TextLink>
      </TableCell>
      <TableCell>
        {props.hasCustomRolesFeature && (
          <RoleActions onEdit={openRole} onDuplicate={duplicateRole} onDelete={deleteRole} />
        )}
      </TableCell>
    </TableRow>
  );
}

RoleListItem.propTypes = {
  role: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string.isRequired
    }).isRequired,
    name: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    description: PropTypes.string
  }).isRequired,
  hasCustomRolesFeature: PropTypes.bool.isRequired,
  onRemoveRole: PropTypes.func.isRequired
};
