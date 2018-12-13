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
  Button,
  Notification
} from '@contentful/forma-36-react-components';
import { href, go } from 'states/Navigator.es6';
import {
  removeMembership,
  removeInvitation
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getInvitedUsers } from '../UserInvitationUtils.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import UserInvitationRemovalModal from '../UserInvitationRemovalModal.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

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

  goToUserInvitationDetail = invitationId => () => {
    return go({
      path: ['account', 'organizations', 'users', 'invitation'],
      params: {
        invitationId
      }
    });
  };

  getInvitations = async () => {
    const { orgId } = this.props;

    this.setState({ loading: true });

    const invitations = await getInvitedUsers(orgId);

    this.setState({ invitations, loading: false });
  };

  removeInvitation = invitation => async () => {
    const { orgId } = this.props;
    const { invitations } = this.state;
    const { type, id, email } = invitation;

    const endpoint = createOrganizationEndpoint(orgId);

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <UserInvitationRemovalModal isShown={isShown} onClose={onClose} email={email} />
    ));

    if (!confirmation) {
      return;
    }

    try {
      if (type === 'invitation') {
        await removeInvitation(endpoint, id);
      } else if (type === 'organizationMembership') {
        await removeMembership(endpoint, id);
      }
    } catch (e) {
      Notification.error(`Oops… We couldn’t revoke the invitation for ${email}`);

      return;
    }

    Notification.success(`Invitation for ${email} successfully revoked`);

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
                  <TableCell
                    onClick={this.goToUserInvitationDetail(invitation.id)}
                    extraClassNames="user-invitations-list__email">
                    {invitation.email}
                  </TableCell>
                  <TableCell>{invitation.role}</TableCell>
                  <TableCell>{moment(invitation.createdAt).format('MMMM D, YYYY')}</TableCell>
                  <TableCell align="right" extraClassNames="user-invitations-list__buttons">
                    <div>
                      <Button
                        buttonType="muted"
                        size="small"
                        onClick={this.removeInvitation(invitation)}
                        extraClassNames="user-invitations-list__button">
                        Revoke
                      </Button>
                      <Button
                        buttonType="muted"
                        size="small"
                        onClick={this.goToUserInvitationDetail(invitation.id)}
                        extraClassNames="user-invitations-list__button">
                        View
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
