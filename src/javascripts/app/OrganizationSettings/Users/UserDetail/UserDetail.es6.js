import React from 'react';
import PropTypes from 'prop-types';

import Workbench from 'ui/Components/Workbench/JSX.es6';
import {
  Card,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/ui-component-library';

const orgRoles = [
  {
    name: 'Owner',
    value: 'owner',
    description:
      'Organization owners can manage subscriptions, billing and organization memberships.'
  },
  {
    name: 'Admin',
    value: 'admin',
    description:
      'Organization admins cannot manage organization subscriptions nor billing but can manage organization memberships.'
  },
  {
    name: 'Member',
    value: 'member',
    description:
      'Organization members do not have access to any organization information and only have access to assigned spaces.'
  }
];

export default class UserDetail extends React.Component {
  static propTypes = {
    membership: PropTypes.any
  };

  state = {
    orgRoleDropdownIsOpen: false,
    orgRole: this.getOrgRole(this.props.membership.role)
  };

  toggleOrgRoleDropdown() {
    this.setState({ orgRoleDropdownIsOpen: !this.state.orgRoleDropdownIsOpen });
  }

  getOrgRole(id) {
    return orgRoles.find(role => role.value === id);
  }

  changeOrgRole(orgRole) {
    this.setState({ orgRole });
    this.toggleOrgRoleDropdown();
  }

  render() {
    const { membership } = this.props;
    const { user } = membership.sys;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>Organization users</Workbench.Title>
          <div className="workbench-header__actions">
            <Button icon="PlusCircle">Delete user</Button>
          </div>
        </Workbench.Header>
        <Workbench.Content>
          <div style={{ padding: '1em 2em 2em' }}>
            <Card>
              <h1>{`${user.firstName} ${user.lastName}`}</h1>
              <p>{user.email}</p>
              <Dropdown
                isOpen={this.state.orgRoleDropdownIsOpen}
                toggleElement={
                  <Button
                    size="small"
                    buttonType="muted"
                    indicateDropdown
                    onClick={() => this.toggleOrgRoleDropdown()}>
                    {this.state.orgRole.name}
                  </Button>
                }>
                <DropdownList>
                  {orgRoles.map(role => (
                    <DropdownListItem key={role.value} onClick={() => this.changeOrgRole(role)}>
                      {role.name}
                    </DropdownListItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </Card>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
