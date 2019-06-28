import React from 'react';
import PropTypes from 'prop-types';
import { without, truncate } from 'lodash';
import { css } from 'emotion';
import {
  Button,
  CheckboxField,
  Checkbox,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { SpaceRole as SpaceRoleProp } from 'app/OrganizationSettings/PropTypes.es6';
import { ADMIN_ROLE, ADMIN_ROLE_ID } from 'access_control/constants.es6';

const styles = {
  adminListItem: css({
    display: 'grid',
    gridTemplateColumns: 'min-content 10rem',
    gridColumnGap: '4px',
    alignItems: 'center',
    color: tokens.colorTextDark
  }),
  adminSubtitle: css({
    color: tokens.colorTextLight,
    gridColumnStart: 2,
    maxWidth: '200px',
    whiteSpace: 'normal'
  })
};

class SpaceRoleEditor extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    options: PropTypes.arrayOf(SpaceRoleProp),
    value: PropTypes.arrayOf(PropTypes.string)
  };

  static defaultProps = {
    options: [],
    value: []
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
    const { options, value, isDisabled } = this.props;
    const isAdmin = value.includes(ADMIN_ROLE_ID);

    const selectedNames = [ADMIN_ROLE, ...options]
      .filter(option => value.includes(option.sys.id))
      .map(role => role.name)
      .join(', ');

    return (
      <Dropdown
        isOpen={this.state.isOpen}
        onClose={this.closeDropdown}
        style={{ maxWidth: '100%' }}
        toggleElement={
          <Button
            testId="space-role-editor.button"
            disabled={isDisabled}
            className="select-button"
            buttonType="naked"
            indicateDropdown
            onClick={this.toggleDropdown}>
            {truncate(selectedNames) || 'Select a role'}
          </Button>
        }>
        <DropdownList maxHeight={300}>
          <DropdownListItem onClick={this.toggleRole(ADMIN_ROLE_ID)}>
            <div className={styles.adminListItem}>
              <Checkbox
                testId="space-role-editor.admin-option"
                labelText={ADMIN_ROLE.name}
                checked={isAdmin}
                onChange={this.toggleRole(ADMIN_ROLE_ID)}
                onClick={event => {
                  event.stopPropagation();
                }}
                id={ADMIN_ROLE_ID}
              />
              <div>{ADMIN_ROLE.name}</div>
              <div className={styles.adminSubtitle}>Can manage everything in the space</div>
            </div>
          </DropdownListItem>
        </DropdownList>
        <DropdownList border="top">
          <DropdownListItem isTitle={true}>other roles</DropdownListItem>
          {options.map(({ name, sys: { id } }) => (
            <DropdownListItem key={id} onClick={this.toggleRole(id)}>
              <CheckboxField
                testId="space-role-editor.role-option"
                labelIsLight
                labelText={name}
                checked={value.includes(id)}
                value={id}
                onChange={this.toggleRole(id)}
                onClick={event => {
                  event.stopPropagation();
                }}
                id={id}
              />
            </DropdownListItem>
          ))}
        </DropdownList>
      </Dropdown>
    );
  }
}

export default SpaceRoleEditor;
