import React from 'react';
import PropTypes from 'prop-types';
import { without, findIndex } from 'lodash';

import { SpaceMembership, User } from '../PropTypes.es6';

import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import {
  create as createSpaceMembershipRepo,
  getMembershipRoles
} from 'access_control/SpaceMembershipRepository.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';

import SpaceMembershipEditor from './SpaceMembershipEditor.es6';
import SpaceMembershipDropDown from './SpaceMembershipDropdown.es6';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TextLink
} from '@contentful/ui-component-library';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserSpaceMemberships extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object.isRequired
    }).isRequired,
    initialMemberships: PropTypes.arrayOf(SpaceMembership),
    user: User.isRequired,
    orgId: PropTypes.string
  };

  state = {
    memberships: this.props.initialMemberships,
    showingForm: false,
    editingMembershipId: null,
    spaces: [],
    roles: []
  };

  orgEndpoint = createOrganizationEndpoint(this.props.orgId);

  createRepoFromSpaceMembership(membership) {
    const { space } = membership.sys;
    const spaceId = space.sys.id;
    const spaceEndpoint = createSpaceEndpoint(spaceId);
    return createSpaceMembershipRepo(spaceEndpoint);
  }

  fetchSpaceRoles = async spaceId => {
    const allRoles = await getAllRoles(this.orgEndpoint);
    const roles = allRoles.filter(role => role.sys.space.sys.id === spaceId);
    this.setState({ roles });
  };

  showSpaceMembershipEditor = async () => {
    this.setState({ loadingSpaces: true });
    const spaces = await getAllSpaces(this.orgEndpoint);

    this.setState({
      spaces,
      showingForm: true,
      loadingSpaces: false
    });
  };

  hideSpaceMembershipEditor = () => {
    this.setState({ showingForm: false, editingMembershipId: null });
  };

  handleMembershipCreated = membership => {
    const { user, $services } = this.props;

    this.setState({
      memberships: [...this.state.memberships, membership]
    });

    this.hideSpaceMembershipEditor();

    $services.notification.info(`
      ${user.firstName} has been successfully added to the space ${membership.sys.space.name}
    `);
  };

  handleMembershipRemove = async membership => {
    const { memberships } = this.state;
    const { user, $services } = this.props;
    const { space } = membership.sys;
    const repo = this.createRepoFromSpaceMembership(membership);

    try {
      await repo.remove(membership);
    } catch (e) {
      $services.notification.error(e.message);
      return;
    }

    this.setState({
      memberships: without(memberships, membership)
    });

    $services.notification.info(`
      ${user.firstName} is no longer part of the space ${space.name}
    `);
  };

  handleMembershipChange = async membership => {
    const { user, $services } = this.props;
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

  renderMembershipRow(membership) {
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
    const { memberships, showingForm, editingMembershipId, roles, spaces } = this.state;

    return (
      <section>
        {(!!memberships.length || showingForm) && (
          <Table style={{ marginBottom: 20 }}>
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
                      onMembershipChanged={this.handleMembershipChange}
                      onCancel={this.hideSpaceMembershipEditor}
                    />
                  );
                } else {
                  return this.renderMembershipRow(membership);
                }
              })}
              {showingForm && (
                <SpaceMembershipEditor
                  spaces={spaces}
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
          <TextLink icon="Plus" onClick={this.showSpaceMembershipEditor}>
            Add to a space
          </TextLink>
        )}
      </section>
    );
  }
}

export default ServicesConsumer('notification')(UserSpaceMemberships);
