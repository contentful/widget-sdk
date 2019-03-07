import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import {
  User as UserPropType,
  SpaceMembership as SpaceMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import { ADMIN_ROLE_ID } from 'access_control/constants.es6';

import {
  TableRow,
  TableCell,
  Select,
  Option,
  Button,
  Notification
} from '@contentful/forma-36-react-components';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor.es6';

const EndpointFactory = getModule('data/EndpointFactory.es6');
const SpaceMembershipRepository = getModule('access_control/SpaceMembershipRepository.es6');

class SpaceMembershipEditor extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired,
    currentUser: UserPropType.isRequired,
    roles: PropTypes.array.isRequired,
    onSpaceSelected: PropTypes.func,
    onMembershipCreated: PropTypes.func,
    onMembershipChanged: PropTypes.func,
    spaces: PropTypes.array,
    onCancel: PropTypes.func,
    orgId: PropTypes.string,
    initialMembership: SpaceMembershipPropType
  };

  isEditing = Boolean(this.props.initialMembership);

  submitButtonLabel = this.isEditing ? 'Change role' : 'Add to space';

  state = {
    busy: false,
    selectedSpace: null,
    // TODO: consider spliting edit and creation in two different components
    selectedRoles: this.getInitialRoleIds()
  };

  orgEndpoint = EndpointFactory.createOrganizationEndpoint(this.props.orgId);

  componentDidMount() {
    const { initialMembership } = this.props;

    if (initialMembership) {
      this.setSpace(initialMembership.sys.space.sys.id);
    }
  }

  /**
   * If editing a membership, return a list of the role ids.
   * Otherwise, return an array containing a fake admin role id
   */
  getInitialRoleIds() {
    const { initialMembership } = this.props;
    if (this.isEditing) {
      return SpaceMembershipRepository.getMembershipRoles(initialMembership).map(
        role => role.sys.id
      );
    }
    return [ADMIN_ROLE_ID];
  }

  setSpace(spaceId) {
    this.props.onSpaceSelected(spaceId);
    this.setState({
      selectedSpace: spaceId
    });
  }

  setRoles = selectedRoles => {
    this.setState({ selectedRoles });
  };

  async submit() {
    const {
      user,
      currentUser,
      spaces,
      onMembershipCreated,
      onMembershipChanged,
      initialMembership,
      roles
    } = this.props;
    const { selectedRoles, selectedSpace } = this.state;
    const spaceEndpoint = EndpointFactory.createSpaceEndpoint(selectedSpace);
    const repo = SpaceMembershipRepository.create(spaceEndpoint);
    const isEditing = Boolean(initialMembership);
    const createdBy = isEditing ? initialMembership.sys.createdBy : currentUser;
    let membership;

    this.setState({ busy: true });

    if (isEditing) {
      // updating
      try {
        membership = await repo.changeRoleTo(initialMembership, selectedRoles);
      } catch (e) {
        Notification.error(e.data.message);
        this.setState({ busy: false });
        return;
      }
    } else {
      // creating
      try {
        membership = await repo.invite(user.email, selectedRoles);
      } catch (e) {
        Notification.error(e.data.message);
        this.setState({ busy: false });
        return;
      }
    }

    const space = isEditing
      ? initialMembership.sys.space
      : spaces.find(space => space.sys.id === selectedSpace);
    const membershipRoles = roles.filter(role => selectedRoles.includes(role.sys.id));

    membership.sys.space = space;
    membership.roles = membershipRoles;
    membership.sys.createdBy = createdBy;

    this.setState({ busy: false }, () => {
      if (isEditing) {
        onMembershipChanged && onMembershipChanged(membership);
      } else {
        onMembershipCreated && onMembershipCreated(membership);
      }
    });
  }

  render() {
    const { selectedSpace, selectedRoles, busy } = this.state;
    const { roles, spaces, initialMembership, onCancel } = this.props;

    return (
      <TableRow extraClassNames="space-membership-editor">
        <TableCell>
          {initialMembership ? (
            initialMembership.sys.space.name
          ) : (
            <Select
              name="spaceId"
              onChange={evt => this.setSpace(evt.target.value)}
              id="new-membership-space"
              isDisabled={busy}>
              <Option value={''}>Select a space</Option>
              {spaces &&
                spaces.map(space => (
                  <Option key={space.sys.id} value={space.sys.id}>
                    {space.name}
                  </Option>
                ))}
            </Select>
          )}
        </TableCell>
        <TableCell colSpan="2">
          <SpaceRoleEditor
            isDisabled={!selectedSpace}
            options={roles}
            value={selectedRoles}
            onChange={this.setRoles}
          />
        </TableCell>
        <TableCell align="right" colSpan="2">
          <Button
            style={{ marginRight: '10px' }}
            buttonType="positive"
            disabled={!selectedSpace || !selectedRoles.length}
            onClick={() => this.submit()}
            loading={busy}>
            {this.submitButtonLabel}
          </Button>
          <Button buttonType="naked" onClick={onCancel}>
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}

export default SpaceMembershipEditor;
