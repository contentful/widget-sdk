import React from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown, DropdownList, DropdownListItem } from '@contentful/ui-component-library';

import { orgRoles } from './OrgRoles.es6';

export class OrganizationRoleSelector extends React.Component {
  static propTypes = {
    initialRole: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
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

  render() {
    return (
      <React.Fragment>
        <Dropdown
          onClose={this.toggle}
          toggleElement={this.renderToggle()}
          isOpen={this.state.isOpen}>
          <DropdownList>
            {orgRoles.map(role => (
              <DropdownListItem key={role.value} onClick={() => this.selectRole(role)}>
                <div style={{ width: 300, whiteSpace: 'normal' }}>
                  <h4 style={{ marginTop: 0 }}>{role.name}</h4>
                  <p>{role.description}</p>
                </div>
              </DropdownListItem>
            ))}
          </DropdownList>
        </Dropdown>
        <p style={{ width: 360, marginTop: 20 }}>{this.getOrgRole().description}</p>
      </React.Fragment>
    );
  }
}
