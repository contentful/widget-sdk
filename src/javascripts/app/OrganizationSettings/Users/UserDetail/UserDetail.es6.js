import React from 'react';
import PropTypes from 'prop-types';

import Workbench from 'ui/Components/Workbench/JSX.es6';
import { go } from 'states/Navigator.es6';
import { TextField, SelectField, Option, Button } from '@contentful/ui-component-library';

import { SpaceMembership, OrganizationMembership } from '../PropTypes.es6';
import { orgRoles } from './OrgRoles.es6';
import { removeMembership } from 'access_control/OrganizationMembershipRepository.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UserSpaceMemberships from './UserSpaceMemberships.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserDetail extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object
    }),
    membership: OrganizationMembership.isRequired,
    spaceMemberships: PropTypes.arrayOf(SpaceMembership).isRequired,
    orgId: PropTypes.string.isRequired
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  toggleOrgRoleDropdown() {
    this.setState({ orgRoleDropdownIsOpen: !this.state.orgRoleDropdownIsOpen });
  }

  getOrgRole(id) {
    return orgRoles.find(role => role.value === id);
  }

  changeOrgRole = () => {};

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
    const { membership, spaceMemberships, orgId } = this.props;
    const { user } = membership.sys;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>{`${user.firstName} ${user.lastName}`}</Workbench.Title>
          <div className="workbench-header__actions">
            <Button buttonType="negative" onClick={() => this.removeMembership()}>
              Remove membership
            </Button>
          </div>
        </Workbench.Header>
        <Workbench.Content>
          <div style={{ padding: '1em 2em 2em' }}>
            <TextField
              labelText="Email"
              name="email"
              id="email"
              value={user.email}
              textInputProps={{
                width: 'large',
                disabled: true
              }}
              style={{
                marginBottom: 30
              }}
            />
            <SelectField
              id="role"
              name="role"
              onChange={this.changeOrgRole}
              labelText="Organization role"
              value={membership.role}
              selectProps={{
                name: 'role',
                width: 'large'
              }}
              style={{
                marginBottom: 60
              }}>
              {orgRoles.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.name}
                </Option>
              ))}
            </SelectField>

            <h3 style={{ marginBottom: 30 }}>Space memberships</h3>
            <UserSpaceMemberships initialMemberships={spaceMemberships} user={user} orgId={orgId} />
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default ServicesConsumer('notification')(UserDetail);
