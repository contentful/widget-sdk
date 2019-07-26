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
  DropdownListItem
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { SpaceRole as SpaceRoleProp } from 'app/OrganizationSettings/PropTypes.es6';
import { ADMIN_ROLE, ADMIN_ROLE_ID } from 'access_control/constants.es6';

const styles = {
  roleListItem: css({
    display: 'grid',
    gridTemplateColumns: 'min-content auto',
    gridColumnGap: '4px',
    alignItems: 'center',
    color: tokens.colorTextDark
  }),
  adminSubtitle: css({
    color: tokens.colorTextLight,
    gridColumnStart: 2,
    maxWidth: '200px',
    whiteSpace: 'normal'
  }),
  rolesSummary: css({
    display: 'inline-block',
    overflowX: 'hidden',
    textOverflow: 'ellipsis'
  })
};

class SpaceRoleEditor extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    options: PropTypes.arrayOf(SpaceRoleProp),
    value: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
    buttonProps: PropTypes.shape({ className: PropTypes.string })
  };

  static defaultProps = {
    options: [],
    value: [],
    className: '',
    buttonProps: { className: '' }
  };

  state = {
    isOpen: false
  };

  setAdmin = () => {
    this.props.onChange([ADMIN_ROLE_ID]);
  };

  toggleRole = roleId => event => {
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
    onChange(value.filter(id => id !== roleId));
  }

  closeDropdown = () => {
    this.setState({ isOpen: false });
  };

  toggleDropdown = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    const { options, value, isDisabled, className, buttonProps } = this.props;
    const isAdmin = value.includes(ADMIN_ROLE_ID);

    const sortedOptions = [...options].sort(({ name: nameA }, { name: nameB }) =>
      nameA.localeCompare(nameB)
    );
    const selectedNames = [ADMIN_ROLE, ...sortedOptions]
      .filter(option => value.includes(option.sys.id))
      .map(role => role.name);

    let rolesSummary;
    if (selectedNames.length === 0) {
      rolesSummary = 'Select a role';
    }
    if (selectedNames.length === 1) {
      rolesSummary = selectedNames[0];
    }
    if (selectedNames.length > 1) {
      rolesSummary = (
        <span className={css({ display: 'flex', alignItems: 'center' })}>
          <span className={styles.rolesSummary}>{selectedNames[0]}</span>&nbsp;and{' '}
          {selectedNames.length - 1} more
        </span>
      );
    }

    return (
      <Dropdown
        className={className}
        isOpen={this.state.isOpen}
        onClose={this.closeDropdown}
        style={{ maxWidth: '100%' }}
        toggleElement={
          <Button
            testId="space-role-editor.button"
            disabled={isDisabled}
            className={`select-button${buttonProps.className ? ` ${buttonProps.className}` : ''}`}
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
            <div className={styles.roleListItem}>
              <Checkbox labelText={ADMIN_ROLE.name} checked={isAdmin} id={ADMIN_ROLE_ID} />
              <div>{ADMIN_ROLE.name}</div>
              <div className={styles.adminSubtitle}>Can manage everything in the space</div>
            </div>
          </DropdownListItem>
        </DropdownList>
        <DropdownList border="top" maxHeight={305}>
          <DropdownListItem isTitle={true}>other roles</DropdownListItem>
          {sortedOptions.map(({ name, sys: { id } }) => (
            // Allow the whole list item to be clicked
            <DropdownListItem
              key={id}
              testId="space-role-editor.role-option"
              onClick={this.toggleRole(id)}>
              <div className={styles.roleListItem}>
                {/* We don't use CheckboxField, as it emits double click events */}
                {/* https://codesandbox.io/embed/cocky-wiles-r03rq */}
                <Checkbox labelText={name} checked={value.includes(id)} id={id} />
                <div>{name}</div>
              </div>
            </DropdownListItem>
          ))}
        </DropdownList>
      </Dropdown>
    );
  }
}

export default SpaceRoleEditor;
