import React from 'react';
import PropTypes from 'prop-types';

import { User, SpaceMembership } from '../PropTypes.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import {
  create as createSpaceMembershipRepo,
  ADMIN_ROLE_ID,
  getMembershipRoles
} from 'access_control/SpaceMembershipRepository.es6';
import ResolveLinks from '../../LinkResolver.es6';

import { TableRow, TableCell, Select, Option, Button } from '@contentful/ui-component-library';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class SpaceMembershipEditor extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object.isRequired
    }).isRequired,
    user: User.isRequired,
    onSpaceSelected: PropTypes.func,
    onMembershipCreated: PropTypes.func,
    onMembershipChanged: PropTypes.func,
    spaces: PropTypes.array,
    roles: PropTypes.array,
    onCancel: PropTypes.func,
    orgId: PropTypes.string,
    initialMembership: SpaceMembership
  };

  state = {
    selectedSpace: null,
    // TODO: consider spliting edit and creation in two different components
    // TODO: support multiple roles
    selectedRole: this.props.initialMembership
      ? getMembershipRoles(this.props.initialMembership)[0].sys.id
      : ADMIN_ROLE_ID
  };

  orgEndpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    const { initialMembership } = this.props;

    if (initialMembership) {
      this.setSpace(initialMembership.sys.space.sys.id);
    }
  }

  async setSpace(spaceId) {
    this.props.onSpaceSelected(spaceId);
    this.setState({
      selectedSpace: spaceId
    });
  }

  setRole(roleId) {
    this.setState({ selectedRole: roleId });
  }

  async submit() {
    const {
      user,
      spaces,
      onMembershipCreated,
      $services,
      onMembershipChanged,
      initialMembership,
      roles
    } = this.props;
    const { selectedRole, selectedSpace } = this.state;
    const spaceEndpoint = createSpaceEndpoint(selectedSpace);
    const repo = createSpaceMembershipRepo(spaceEndpoint);
    const isEditing = Boolean(initialMembership);
    let membership;

    // updating
    if (isEditing) {
      try {
        membership = await repo.changeRoleTo(initialMembership, [selectedRole]);
      } catch (e) {
        $services.notification.error(e.message);
        return;
      }
    } else {
      // creating
      try {
        membership = await repo.invite(user.email, [selectedRole]);
      } catch (e) {
        $services.notification.error(e.message);
        return;
      }
    }

    const space = isEditing
      ? initialMembership.sys.space
      : spaces.find(space => space.sys.id === selectedSpace);
    const role = roles.find(role => role.sys.id === selectedRole);

    // In the list of memberships we show the space and the role names
    // This is only possible because we include the space and role information
    // in the GET API request. The same can't be done in a POST request.
    // This is why we have to do it manually here.
    const [resolved] = ResolveLinks({
      paths: ['sys.space', 'roles'],
      includes: {
        Space: [space],
        Role: [role]
      },
      items: [membership]
    });

    if (isEditing) {
      onMembershipChanged && onMembershipChanged(resolved);
    } else {
      onMembershipCreated && onMembershipCreated(resolved);
    }
  }

  render() {
    const { selectedSpace, selectedRole } = this.state;
    const { roles, spaces, initialMembership, onCancel } = this.props;

    return (
      <TableRow>
        <TableCell>
          {initialMembership ? (
            initialMembership.sys.space.name
          ) : (
            <Select
              name="spaceId"
              onChange={evt => this.setSpace(evt.target.value)}
              id="new-membership-space">
              <Option>Select a space</Option>
              {spaces &&
                spaces.map(space => (
                  <Option key={space.sys.id} value={space.sys.id}>
                    {space.name}
                  </Option>
                ))}
            </Select>
          )}
        </TableCell>
        <TableCell>
          <Select
            name="roleId"
            isDisabled={!this.state.selectedSpace}
            onChange={evt => this.setRole(evt.target.value)}
            id="new-membership-role"
            value={selectedRole}>
            <Option value={ADMIN_ROLE_ID}>Admin</Option>
            {roles &&
              roles.map(role => (
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
          <Button buttonType="naked" onClick={onCancel}>
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}

export default ServicesConsumer('notification')(SpaceMembershipEditor);
