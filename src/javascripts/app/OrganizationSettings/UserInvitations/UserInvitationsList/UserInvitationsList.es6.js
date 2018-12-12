import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { orderBy, without } from 'lodash';
import {
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableBody,
  TextLink,
  Button
} from '@contentful/forma-36-react-components';
import { href } from 'states/Navigator.es6';
import {
  removeMembership,
  removeInvitation
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getInvitedUsers } from '../UserInvitationUtils.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import Workbench from 'app/common/Workbench.es6';

export default class InvitationsList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    membershipsCount: PropTypes.number.isRequired
  };

  state = {
    loading: true
  };

  componentDidMount() {
    this.getInvitations();
  }

  getLinkToUsersList() {
    return href({
      path: ['account', 'organizations', 'users'],
      params: { orgId: this.props.orgId }
    });
  }

  getLinkToUserInvitationDetail(invitationId) {
    return href({
      path: ['account', 'organizations', 'users', 'invitation'],
      params: {
        orgId: this.props.orgId,
        invitationId
      }
    });
  }

  getInvitations = async () => {
    const { orgId } = this.props;

    this.setState({ loading: true });

    const invitations = await getInvitedUsers(orgId);

    this.setState({ invitations, loading: false });
  };

  removeInvitation = invitation => async () => {
    const { orgId } = this.props;
    const { invitations } = this.state;
    const { type, id } = invitation;

    const endpoint = createOrganizationEndpoint(orgId);

    if (type === 'invitation') {
      await removeInvitation(endpoint, id);
    } else if (type === 'organizationMembership') {
      await removeMembership(endpoint, id);
    }

    this.setState({ invitations: without(invitations, invitation) });
  };

  render() {
    const { membershipsCount } = this.props;
    const { loading, invitations } = this.state;
    const sortedList = orderBy(invitations, ['createdAt'], ['desc']);

    if (loading) {
      return <FetcherLoading message="Loading invitations..." />;
    }

    return (
      <Workbench className="user-invitations-list">
        <Workbench.Header>
          <Workbench.Title>{`Invited users (${invitations.length})`}</Workbench.Title>
          <TextLink href={this.getLinkToUsersList()}>View all users ({membershipsCount})</TextLink>
        </Workbench.Header>
        <Workbench.Content style={{ padding: '2.5em 2em' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">User</TableCell>
                <TableCell width="200">Organization role</TableCell>
                <TableCell colSpan="2">Invited at (most recent)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedList.map(invitation => (
                <TableRow key={invitation.id} extraClassNames="user-invitations-list__row">
                  <TableCell>
                    <TextLink href={this.getLinkToUserInvitationDetail(invitation.id)}>
                      {invitation.email}
                    </TextLink>
                  </TableCell>
                  <TableCell>{invitation.role}</TableCell>
                  <TableCell>
                    {moment(invitation.createdAt).format('MMM Do YYYY, hh:mm a')}
                  </TableCell>
                  <TableCell align="right" extraClassNames="user-invitations-list__buttons">
                    <div>
                      <Button
                        buttonType="negative"
                        size="small"
                        onClick={this.removeInvitation(invitation)}
                        extraClassNames="user-invitations-list__button">
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Workbench.Content>
      </Workbench>
    );
  }
}
