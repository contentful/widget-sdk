import React from 'react';
import PropTypes from 'prop-types';

import { User, SpaceMembership } from '../PropTypes.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import {
  create as createSpaceMembershipRepo,
  ADMIN_ROLE_ID
} from 'access_control/SpaceMembershipRepository.es6';

import { TableRow, TableCell, Select, Option, Button } from '@contentful/ui-component-library';

export default class SpaceMembershipEditor extends React.Component {
  static propTypes = {
    user: User.isRequired,
    onMembershipCreated: PropTypes.func,
    orgId: PropTypes.string,
    initialMembership: SpaceMembership
  };

  state = {
    spaces: [],
    roles: [],
    selectedSpace: null,
    selectedRole: ADMIN_ROLE_ID
  };

  orgEndpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    const spaces = await getAllSpaces(this.orgEndpoint);
    this.setState({ spaces });
  }

  async setSpace(spaceId) {
    const allRoles = await getAllRoles(this.orgEndpoint);
    const roles = allRoles.filter(role => role.sys.space.sys.id === spaceId);
    this.setState({
      selectedSpace: spaceId,
      selectedRole: ADMIN_ROLE_ID,
      roles
    });
  }

  setRole(roleId) {
    this.setState({ selectedRole: roleId });
  }

  async submit() {
    const { user, onMembershipCreated } = this.props;
    const { selectedRole, selectedSpace } = this.state;
    const spaceEndpoint = createSpaceEndpoint(selectedSpace);
    const repo = createSpaceMembershipRepo(spaceEndpoint);
    const membership = await repo.invite(user.email, [selectedRole]);
    onMembershipCreated(membership);
  }

  render() {
    const { spaces, roles, selectedSpace, selectedRole } = this.state;
    return (
      <TableRow>
        <TableCell>
          <Select onChange={evt => this.setSpace(evt.target.value)} id="new-membership-space">
            <Option value={null}>Select a space</Option>
            {spaces &&
              spaces.map(space => (
                <Option key={space.sys.id} value={space.sys.id}>
                  {space.name}
                </Option>
              ))}
          </Select>
        </TableCell>
        <TableCell>
          <Select
            isDisabled={!this.state.selectedSpace}
            onChange={evt => this.setRole(evt.target.value)}
            id="new-membership-role">
            <Option value={ADMIN_ROLE_ID}>Admin</Option>
            {roles.map(role => (
              <Option key={role.sys.id} value={role.sys.id}>
                {role.name}
              </Option>
            ))}
          </Select>
        </TableCell>
        <TableCell colSpan="2">
          <Button
            style={{ marginRight: '10px' }}
            buttonType="positive"
            disabled={!selectedRole || !selectedSpace}
            onClick={() => this.submit()}>
            Add to space
          </Button>
          <Button buttonType="naked" onClick={() => this.cancel()}>
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}
