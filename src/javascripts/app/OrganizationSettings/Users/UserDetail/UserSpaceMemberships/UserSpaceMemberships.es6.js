import React from 'react';
import PropTypes from 'prop-types';
import { without, findIndex, map } from 'lodash';

import {
  SpaceMembership as SpaceMembershipPropType,
  User as UserPropType,
  SpaceRole as SpaceRolePropType,
  Space as SpacePropType
} from '../../PropTypes.es6';

import { joinWithAnd } from 'utils/StringUtils.es6';

import SpaceMembershipEditor from './SpaceMembershipEditor.es6';
import SpaceMembershipDropDown from './SpaceMembershipDropdown.es6';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TextLink,
  Tooltip
} from '@contentful/ui-component-library';

const ServicesConsumer = require('../../../../../reactServiceContext').default;

class UserSpaceMemberships extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object.isRequired,
      ConfirmationDialog: PropTypes.object.isRequired,
      EndpointFactory: PropTypes.object.isRequired,
      OrganizationMembershipRepository: PropTypes.object.isRequired,
      SpaceMembershipRepository: PropTypes.object.isRequired
    }).isRequired,
    initialMemberships: PropTypes.arrayOf(SpaceMembershipPropType),
    user: UserPropType.isRequired,
    orgId: PropTypes.string,
    roles: PropTypes.arrayOf(SpaceRolePropType),
    spaces: PropTypes.arrayOf(SpacePropType)
  };

  state = {
    memberships: this.props.initialMemberships || [],
    showingForm: false,
    editingMembershipId: null,
    loadingSpaces: false,
    availableSpaces: this.getAvailableSpaces(this.props.initialMemberships)
  };

  orgEndpoint = this.props.$services.EndpointFactory.createOrganizationEndpoint(this.props.orgId);

  createRepoFromSpaceMembership(membership) {
    const { createSpaceEndpoint } = this.props.$services.EndpointFactory;
    const { create: createSpaceMembershipRepo } = this.props.$services.SpaceMembershipRepository;
    const { space } = membership.sys;
    const spaceId = space.sys.id;
    const spaceEndpoint = createSpaceEndpoint(spaceId);
    return createSpaceMembershipRepo(spaceEndpoint);
  }

  fetchSpaceRoles = async spaceId => {
    const { getAllRoles } = this.props.$services.OrganizationMembershipRepository;
    const allRoles = await getAllRoles(this.orgEndpoint);
    const roles = allRoles.filter(role => role.sys.space.sys.id === spaceId);
    this.setState({ roles });
  };

  showSpaceMembershipEditor = () => {
    this.setState({
      showingForm: true
    });
  };

  hideSpaceMembershipEditor = () => {
    this.setState({ showingForm: false, editingMembershipId: null });
  };

  handleMembershipCreated = newMembership => {
    const { user, $services } = this.props;
    const { memberships } = this.state;
    const updatedMemberships = [...memberships, newMembership];

    this.setState({
      memberships: updatedMemberships,
      availableSpaces: this.getAvailableSpaces(updatedMemberships)
    });
    this.hideSpaceMembershipEditor();

    $services.notification.info(`
      ${user.firstName} has been successfully added to the space ${newMembership.sys.space.name}
    `);
  };

  handleMembershipRemove = async membership => {
    const { memberships } = this.state;
    const { user, $services } = this.props;
    const { space } = membership.sys;
    const repo = this.createRepoFromSpaceMembership(membership);
    const body = (
      <React.Fragment>
        <p>
          You are about to remove {user.firstName} {user.lastName} from the space {space.name}.
        </p>
        <p>
          After removal this user will not be able to access this space in any way. Do you want to
          proceed?
        </p>
      </React.Fragment>
    );
    const confirmation = await $services.ConfirmationDialog.confirm({
      title: 'Remove user from a space',
      body
    });

    if (!confirmation) {
      return;
    }

    try {
      await repo.remove(membership);
    } catch (e) {
      $services.notification.error(e.message);
      return;
    }

    const updatedMemberships = without(memberships, membership);

    this.setState({
      memberships: updatedMemberships,
      availableSpaces: this.getAvailableSpaces(updatedMemberships)
    });

    $services.notification.info(`
      ${user.firstName} is no longer part of the space ${space.name}
    `);
  };

  handleMembershipChanged = async membership => {
    const { user, $services } = this.props;
    const { getMembershipRoles } = $services.SpaceMembershipRepository;
    const { space } = membership.sys;
    const memberships = [...this.state.memberships];
    const roleNames = getMembershipRoles(membership).map(role => role.name);
    const index = findIndex(memberships, item => item.sys.id === membership.sys.id);
    memberships[index] = membership;

    this.setState({
      memberships,
      editingMembershipId: null
    });

    $services.notification.info(`
      ${user.firstName} is now ${joinWithAnd(roleNames)} in the the space ${space.name}
    `);
  };

  getAvailableSpaces(memberships) {
    const { spaces } = this.props;
    const membershipSpaceIds = map(memberships, 'sys.space.sys.id');

    return spaces
      .filter(space => {
        return !membershipSpaceIds.includes(space.sys.id);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getUnavailabilityReason() {
    const { spaces, user } = this.props;
    const { availableSpaces } = this.state;

    if (spaces.length === 0) {
      return 'There are no spaces available. Please create a space first';
    } else if (availableSpaces.length === 0) {
      return `${user.firstName} is already a member of all spaces`;
    }

    return null;
  }

  renderMembershipRow(membership) {
    const { getMembershipRoles } = this.props.$services.SpaceMembershipRepository;

    return (
      <TableRow key={membership.sys.id}>
        <TableCell>{membership.sys.space.name}</TableCell>
        <TableCell>
          {getMembershipRoles(membership)
            .map(role => role.name)
            .join(', ')}
        </TableCell>
        <TableCell align="right">
          <SpaceMembershipDropDown
            membership={membership}
            onMembershipChange={membership => {
              this.setState({ editingMembershipId: membership.sys.id });
            }}
            onMembershipRemove={this.handleMembershipRemove}
          />
        </TableCell>
      </TableRow>
    );
  }

  render() {
    const { user, orgId } = this.props;
    const { memberships, showingForm, editingMembershipId, roles, availableSpaces } = this.state;
    const unavailabilityReason = this.getUnavailabilityReason();

    return (
      <section>
        {(!!memberships.length || showingForm) && (
          <Table style={{ marginBottom: 20, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell width="30%">Space</TableCell>
                <TableCell width="45%">Roles</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {memberships.map(membership => {
                if (editingMembershipId === membership.sys.id) {
                  return (
                    <SpaceMembershipEditor
                      user={user}
                      orgId={orgId}
                      initialMembership={membership}
                      roles={roles}
                      onSpaceSelected={this.fetchSpaceRoles}
                      onMembershipChanged={this.handleMembershipChanged}
                      onCancel={this.hideSpaceMembershipEditor}
                    />
                  );
                } else {
                  return this.renderMembershipRow(membership);
                }
              })}
              {showingForm && (
                <SpaceMembershipEditor
                  spaces={availableSpaces}
                  roles={roles}
                  user={user}
                  orgId={orgId}
                  onMembershipCreated={this.handleMembershipCreated}
                  onSpaceSelected={this.fetchSpaceRoles}
                  onCancel={this.hideSpaceMembershipEditor}
                />
              )}
            </TableBody>
          </Table>
        )}

        {!showingForm && (
          <Tooltip content={unavailabilityReason} place="right">
            <TextLink
              icon="Plus"
              disabled={!!unavailabilityReason}
              onClick={this.showSpaceMembershipEditor}>
              Add to a space
            </TextLink>
          </Tooltip>
        )}
      </section>
    );
  }
}

export default ServicesConsumer(
  'notification',
  {
    as: 'EndpointFactory',
    from: 'data/EndpointFactory.es6'
  },
  {
    as: 'SpaceMembershipRepository',
    from: 'access_control/SpaceMembershipRepository.es6'
  },
  {
    as: 'OrganizationMembershipRepository',
    from: 'access_control/OrganizationMembershipRepository.es6'
  },
  {
    as: 'ConfirmationDialog',
    from: 'app/ConfirmationDialog.es6'
  }
)(UserSpaceMemberships);
