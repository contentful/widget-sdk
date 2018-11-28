import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { keyBy } from 'lodash';

import { orgRoles } from './OrgRoles.es6';

export class OrganizationRoleSelector extends React.Component {
  static propTypes = {
    initialRole: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    isSelf: PropTypes.bool,
    disableOwnerRole: PropTypes.bool,
    style: PropTypes.object
  };

  state = {
    isOpen: false
  };

  getOrgRole() {
    return orgRoles.find(role => role.value === this.props.initialRole);
  }

  selectRole(role) {
    this.props.onChange(role.value);
    this.toggle();
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  renderToggle() {
    return (
      <Button buttonType="muted" size="small" indicateDropdown onClick={() => this.toggle()}>
        {this.getOrgRole().name}
      </Button>
    );
  }

  renderOption(role, disabled) {
    return (
      <DropdownListItem
        key={role.value}
        onClick={() => this.selectRole(role)}
        isDisabled={disabled}>
        <div style={{ width: 300, whiteSpace: 'normal' }}>
          <h4 style={{ marginTop: 0 }}>{role.name}</h4>
          <p>{role.description}</p>
        </div>
      </DropdownListItem>
    );
  }

  render() {
    const roles = keyBy(orgRoles, 'value');
    const { style } = this.props;

    return (
      <Dropdown
        onClose={this.toggle}
        toggleElement={this.renderToggle()}
        isOpen={this.state.isOpen}
        style={style}>
        <DropdownList>
          {this.renderOption(roles.owner, this.props.disableOwnerRole)}
          {this.renderOption(roles.admin)}
          {this.renderOption(roles.member)}
        </DropdownList>
      </Dropdown>
    );
  }
}
