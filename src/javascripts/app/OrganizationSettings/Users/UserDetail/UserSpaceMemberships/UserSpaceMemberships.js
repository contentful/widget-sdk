/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import { without, findIndex, map } from 'lodash';

import {
  SpaceMembership as SpaceMembershipPropType,
  User as UserPropType,
  SpaceRole as SpaceRolePropType,
  Space as SpacePropType
} from 'app/OrganizationSettings/PropTypes';
import ModalLauncher from 'app/common/ModalLauncher';
import { joinWithAnd } from 'utils/StringUtils';

import SpaceMembershipEditor from './SpaceMembershipEditor';
import SpaceMembershipDropDown from './SpaceMembershipDropdown';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip,
  ModalConfirm,
  Button,
  Notification
} from '@contentful/forma-36-react-components';
import { getUserName, getFirstNameOrEmail } from 'app/OrganizationSettings/Users/UserUtils';
import moment from 'moment';
import { getMembershipRoles } from 'access_control/utils';

import * as SpaceMembershipRepository from 'access_control/SpaceMembershipRepository';
import * as EndpointFactory from 'data/EndpointFactory';

class UserSpaceMemberships extends React.Component {
  static propTypes = {
    initialMemberships: PropTypes.arrayOf(SpaceMembershipPropType),
    user: UserPropType.isRequired,
    currentUser: UserPropType,
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

  orgEndpoint = EndpointFactory.createOrganizationEndpoint(this.props.orgId);

  createRepoFromSpaceMembership(membership) {
    const { space } = membership.sys;
    const spaceId = space.sys.id;
    const spaceEndpoint = EndpointFactory.createSpaceEndpoint(spaceId);
    return SpaceMembershipRepository.create(spaceEndpoint);
  }

  showSpaceMembershipEditor = () => {
    this.setState({
      showingForm: true
    });
  };

  hideSpaceMembershipEditor = () => {
    this.setState({ showingForm: false, editingMembershipId: null });
  };

  handleMembershipCreated = newMembership => {
    const { user } = this.props;
    const { memberships } = this.state;
    const updatedMemberships = [newMembership, ...memberships];

    this.setState({
      memberships: updatedMemberships,
      availableSpaces: this.getAvailableSpaces(updatedMemberships)
    });
    this.hideSpaceMembershipEditor();

    Notification.success(`
      ${getFirstNameOrEmail(user)} has been successfully added to the space ${
      newMembership.sys.space.name
    }
    `);
  };

  handleMembershipRemove = async membership => {
    const { memberships } = this.state;
    const { user } = this.props;
    const { space } = membership.sys;
    const repo = this.createRepoFromSpaceMembership(membership);

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        title="Remove user from a space"
        intent="negative"
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <React.Fragment>
          <p>
            You are about to remove {getFirstNameOrEmail(user)} from the space {space.name}.
          </p>
          <p>
            After removal this user will not be able to access this space in any way. Do you want to
            proceed?
          </p>
        </React.Fragment>
      </ModalConfirm>
    ));

    if (!confirmation) {
      return;
    }

    try {
      await repo.remove(membership);
    } catch (e) {
      Notification.error(e.message);
      return;
    }

    const updatedMemberships = without(memberships, membership);

    this.setState({
      memberships: updatedMemberships,
      availableSpaces: this.getAvailableSpaces(updatedMemberships)
    });

    Notification.success(`
      ${getFirstNameOrEmail(user)} is no longer part of the space ${space.name}
    `);
  };

  handleMembershipChanged = async membership => {
    const { user } = this.props;
    const { space } = membership.sys;
    const memberships = [...this.state.memberships];
    const roleNames = getMembershipRoles(membership).map(role => role.name);
    const index = findIndex(memberships, item => item.sys.id === membership.sys.id);
    memberships[index] = membership;

    this.setState({
      memberships,
      editingMembershipId: null
    });

    Notification.success(`
      ${getFirstNameOrEmail(user)} is now ${joinWithAnd(roleNames)} in the space ${space.name}
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
      return `${getFirstNameOrEmail(user)} is already a member of all spaces`;
    }

    return null;
  }

  renderMembershipRow(membership) {
    return (
      <TableRow key={membership.sys.id}>
        <TableCell>{membership.sys.space.name}</TableCell>
        <TableCell>{joinWithAnd(getMembershipRoles(membership).map(role => role.name))}</TableCell>
        <TableCell>{getUserName(membership.sys.createdBy)}</TableCell>
        <TableCell>{moment(membership.sys.createdAt).format('MMMM DD, YYYY')}</TableCell>
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
    const { user, currentUser, orgId, roles } = this.props;
    const {
      memberships,
      showingForm,
      editingMembershipId,
      availableSpaces,
      selectedSpaceId
    } = this.state;
    const unavailabilityReason = this.getUnavailabilityReason();
    const spaceRoles = roles.filter(role => role.sys.space.sys.id === selectedSpaceId);

    return (
      <section>
        <header
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 style={{ marginBottom: 30 }}>Space memberships</h3>
          {!showingForm && (
            <Tooltip content={unavailabilityReason} place="right">
              <Button
                size="small"
                buttonType="primary"
                disabled={!!unavailabilityReason}
                onClick={this.showSpaceMembershipEditor}>
                Add to space
              </Button>
            </Tooltip>
          )}
        </header>
        {(!!memberships.length || showingForm) && (
          <Table
            style={{ marginBottom: 20, tableLayout: 'fixed' }}
            data-test-id="user-memberships-table">
            <TableHead>
              <TableRow>
                <TableCell>Space</TableCell>
                <TableCell>Space roles</TableCell>
                <TableCell>Created by</TableCell>
                <TableCell>Created at</TableCell>
                <TableCell width="200px" />
              </TableRow>
            </TableHead>
            <TableBody>
              {showingForm && (
                <SpaceMembershipEditor
                  spaces={availableSpaces}
                  roles={spaceRoles}
                  currentUser={currentUser}
                  user={user}
                  orgId={orgId}
                  onMembershipCreated={this.handleMembershipCreated}
                  onSpaceSelected={selectedSpaceId => this.setState({ selectedSpaceId })}
                  onCancel={this.hideSpaceMembershipEditor}
                />
              )}
              {memberships.map(membership => {
                if (editingMembershipId === membership.sys.id) {
                  return (
                    <SpaceMembershipEditor
                      key={membership.sys.id}
                      user={user}
                      currentUser={currentUser}
                      orgId={orgId}
                      initialMembership={membership}
                      roles={spaceRoles}
                      onSpaceSelected={selectedSpaceId => this.setState({ selectedSpaceId })}
                      onMembershipChanged={this.handleMembershipChanged}
                      onCancel={this.hideSpaceMembershipEditor}
                    />
                  );
                } else {
                  return this.renderMembershipRow(membership);
                }
              })}
            </TableBody>
          </Table>
        )}
      </section>
    );
  }
}

export default UserSpaceMemberships;
