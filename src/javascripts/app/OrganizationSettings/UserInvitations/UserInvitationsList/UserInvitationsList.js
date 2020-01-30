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
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import {
  removeMembership,
  removeInvitation
} from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getInvitedUsers } from '../UserInvitationUtils';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import UserInvitationRemovalModal from '../UserInvitationRemovalModal';
import ModalLauncher from 'app/common/ModalLauncher';
import StateLink from 'app/common/StateLink';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  workbenchContent: css({
    padding: tokens.spacingXl
  }),
  actionsWrapper: css({
    display: 'flex',
    alignItems: 'center'
  }),
  userListLink: css({
    marginRight: tokens.spacingXs
  })
};

const getUserInvitationDetailLink = invitationId => {
  return {
    path: 'account.organizations.users.invitation',
    params: {
      invitationId
    }
  };
};

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
      <UserInvitationRemovalModal
        isShown={isShown}
        email={email}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}
      />
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
        <Workbench.Header
          title={`Invited users (${invitations.length})`}
          actions={
            <div className={styles.actionsWrapper}>
              <StateLink
                component={TextLink}
                path="account,organizations.users.list"
                className={styles.userListLink}>
                View all users ({membershipsCount})
              </StateLink>
              <StateLink component={Button} path="account.organizations.users.new">
                Invite users
              </StateLink>
            </div>
          }></Workbench.Header>
        <Workbench.Content className={styles.workbenchContent}>
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
                <TableRow key={invitation.id} className="user-invitations-list__row">
                  <StateLink {...getUserInvitationDetailLink(invitation.id)}>
                    {({ onClick }) => (
                      <TableCell onClick={onClick} className="user-invitations-list__email">
                        {invitation.email}
                      </TableCell>
                    )}
                  </StateLink>
                  <TableCell>{invitation.role}</TableCell>
                  <TableCell>{moment(invitation.createdAt).format('MMMM D, YYYY')}</TableCell>
                  <TableCell align="right" className="user-invitations-list__buttons">
                    <div>
                      <Button
                        buttonType="muted"
                        size="small"
                        onClick={this.removeInvitation(invitation)}
                        className="user-invitations-list__button">
                        Revoke
                      </Button>

                      <StateLink
                        component={Button}
                        buttonType="muted"
                        size="small"
                        className="user-invitations-list__button"
                        {...getUserInvitationDetailLink(invitation.id)}>
                        View
                      </StateLink>
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
