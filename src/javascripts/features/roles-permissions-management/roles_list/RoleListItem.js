import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import * as RoleListHandler from '../components/RoleListHandler';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  IconButton,
  Paragraph,
  TableCell,
  TableRow,
  TextLink,
} from '@contentful/forma-36-react-components';
import { ReactRouterLink, useRouteNavigate } from 'core/react-routing';

const styles = {
  clickableCell: css({
    cursor: 'pointer',
    '&:hover > *': {
      color: tokens.colorBlueBase,
    },
  }),
  roleName: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

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
            icon: 'MoreHorizontal',
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
  onDelete: PropTypes.func.isRequired,
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
        <ReactRouterLink
          route={{
            path: 'users.list',
            navigationState: { jumpToRole: RoleListHandler.ADMIN_ROLE_NAME },
          }}
          component={TextLink}>
          {props.count} {props.count !== 1 ? 'members' : 'member'}
        </ReactRouterLink>
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

AdministratorRoleListItem.propTypes = {
  count: PropTypes.number.isRequired,
  hasCustomRolesFeature: PropTypes.bool.isRequired,
};

// eslint-disable-next-line rulesdir/restrict-multiple-react-component-exports
export function RoleListItem(props) {
  const navigate = useRouteNavigate();

  const openRole = () => {
    navigate({
      path: 'roles.detail',
      roleId: props.role.sys.id,
    });
  };

  const deleteRole = () => {
    props.onRemoveRole(props.role);
  };

  const duplicateRole = () => {
    navigate({ path: 'roles.new', navigationState: { baseRoleId: props.role.sys.id } });
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
        <ReactRouterLink
          route={{ path: 'users.list', navigationState: { jumpToRole: props.role.name } }}
          component={TextLink}>
          {props.role.count} {props.role.count !== 1 ? 'members' : 'member'}
        </ReactRouterLink>
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
      id: PropTypes.string.isRequired,
    }).isRequired,
    name: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    description: PropTypes.string,
  }).isRequired,
  hasCustomRolesFeature: PropTypes.bool.isRequired,
  onRemoveRole: PropTypes.func.isRequired,
};
