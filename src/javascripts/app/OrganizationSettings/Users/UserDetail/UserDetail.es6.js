import React from 'react';
import PropTypes from 'prop-types';

import Workbench from 'ui/Components/Workbench/JSX.es6';
import { go } from 'states/Navigator.es6';
import {
  Card,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/ui-component-library';

import { orgRoles } from './OrgRoles.es6';
import { removeMembership } from 'access_control/OrganizationMembershipRepository.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserDetail extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object
    }),
    membership: PropTypes.shape({
      role: PropTypes.oneOf(orgRoles.map(role => role.value)),
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
        user: PropTypes.shape({
          firstName: PropTypes.string.isRequired,
          lastName: PropTypes.string.isRequired,
          avatarUrl: PropTypes.string.isRequired,
          sys: PropTypes.shape({
            id: PropTypes.string.isRequired
          })
        })
      })
    }).isRequired,
    orgId: PropTypes.string.isRequired
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

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

  async removeMembership() {
    const { notification } = this.props.$services;
    const { id } = this.props.membership.sys;

    try {
      await removeMembership(this.endpoint, id);
    } catch (e) {
      notification.error(e.message);
      return;
    }

    this.goToUserList();
  }

  goToUserList() {
    go({
      path: ['account', 'organizations', 'users']
    });
  }

  render() {
    const { membership } = this.props;
    const { user } = membership.sys;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>Organization users</Workbench.Title>
          <div className="workbench-header__actions">
            <Button buttonType="negative" onClick={() => this.removeMembership()}>
              Remove membership
            </Button>
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

export default ServicesConsumer('notification')(UserDetail);
