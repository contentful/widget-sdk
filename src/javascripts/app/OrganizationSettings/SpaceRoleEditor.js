/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import { without } from 'lodash';
import { css } from 'emotion';
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { SpaceRole as SpaceRoleProp } from 'app/OrganizationSettings/PropTypes';
import { ADMIN_ROLE, ADMIN_ROLE_ID } from 'access_control/constants';

const styles = {
  roleList: css({
    maxHeight: '300px',
    overflowY: 'auto',
  }),
  roleListItem: css({
    color: tokens.colorTextDark,
  }),
  adminSubtitle: css({
    color: tokens.colorTextLight,
    gridColumnStart: 2,
    whiteSpace: 'normal',
  }),
  rolesSelector: css({
    width: '100%',
    border: `1px solid ${tokens.colorElementLight}`,
    '&> span': {
      display: 'flex',
      justifyContent: 'space-between',
    },
  }),
};

class SpaceRoleEditor extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    options: PropTypes.arrayOf(SpaceRoleProp),
    value: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    options: [],
    value: [],
    className: '',
    buttonProps: { className: '' },
  };

  state = {
    isOpen: false,
  };

  setAdmin = () => {
    this.props.onChange([ADMIN_ROLE_ID]);
  };

  toggleRole = (roleId) => (event) => {
    event.stopPropagation();
    const isAdmin = roleId === ADMIN_ROLE_ID;
    const checked = this.props.value.includes(roleId);

    if (checked) {
      this.removeRole(roleId);
    } else {
      isAdmin ? this.setAdmin() : this.addRole(roleId);
    }
  };

  addRole(roleId) {
    const { value, onChange } = this.props;
    onChange(without(value, ADMIN_ROLE_ID).concat(roleId));
  }

  removeRole(roleId) {
    const { value, onChange } = this.props;
    onChange(value.filter((id) => id !== roleId));
  }

  closeDropdown = () => {
    this.setState({ isOpen: false });
  };

  toggleDropdown = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    const { options, value, isDisabled } = this.props;
    const isAdmin = value.includes(ADMIN_ROLE_ID);

    const sortedOptions = [...options].sort(({ name: nameA }, { name: nameB }) =>
      nameA.localeCompare(nameB)
    );
    const selectedNames = [ADMIN_ROLE, ...sortedOptions]
      .filter((option) => value.includes(option.sys.id))
      .map((role) => role.name);

    let rolesSummary;
    if (selectedNames.length === 0) {
      rolesSummary = 'Select a space role';
    }
    if (selectedNames.length === 1) {
      rolesSummary = selectedNames[0];
    }
    if (selectedNames.length > 1) {
      rolesSummary = (
        <span className={css({ display: 'flex', alignItems: 'center' })}>
          {selectedNames[0]} and {selectedNames.length - 1} more
        </span>
      );
    }

    return (
      <Dropdown
        isOpen={this.state.isOpen}
        onClose={this.closeDropdown}
        toggleElement={
          <Button
            testId="space-role-editor.button"
            disabled={isDisabled}
            className={styles.rolesSelector}
            buttonType="naked"
            indicateDropdown
            onClick={this.toggleDropdown}>
            {rolesSummary}
          </Button>
        }>
        <DropdownList testId="space-role-editor.options">
          <DropdownListItem
            testId="space-role-editor.admin-option"
            onClick={this.toggleRole(ADMIN_ROLE_ID)}>
            <Grid className={styles.roleListItem} columns="min-content auto" columnGap="spacingXs">
              <Checkbox labelText={ADMIN_ROLE.name} checked={isAdmin} id={ADMIN_ROLE_ID} />
              <div>{ADMIN_ROLE.name}</div>
              <div className={styles.adminSubtitle}>Can manage everything in the space</div>
            </Grid>
          </DropdownListItem>
        </DropdownList>
        {sortedOptions.length > 0 && (
          <DropdownList border="top" maxHeight={200}>
            <DropdownListItem isTitle={true}>other roles</DropdownListItem>
            {sortedOptions.map(({ name, sys: { id } }) => (
              // Allow the whole list item to be clicked
              <DropdownListItem
                key={id}
                testId="space-role-editor.role-option"
                onClick={this.toggleRole(id)}>
                <Grid
                  className={styles.roleListItem}
                  columns="min-content auto"
                  columnGap="spacingXs">
                  {/* We don't use CheckboxField, as it emits double click events */}
                  {/* https://codesandbox.io/embed/cocky-wiles-r03rq */}
                  <Checkbox labelText={name} checked={value.includes(id)} id={id} />
                  <div>{name}</div>
                </Grid>
              </DropdownListItem>
            ))}
          </DropdownList>
        )}
      </Dropdown>
    );
  }
}

export default SpaceRoleEditor;
