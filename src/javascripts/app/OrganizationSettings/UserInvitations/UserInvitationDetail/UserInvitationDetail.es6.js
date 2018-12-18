import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Workbench from 'app/common/Workbench.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  Notification,
  Tooltip
} from '@contentful/forma-36-react-components';
import {
  User as UserPropType,
  SpaceMembership as SpaceMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import { getRoleDescription } from 'utils/MembershipUtils.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  removeInvitation,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { go } from 'states/Navigator.es6';
import { getModule } from 'NgRegistry.es6';
import UserInvitationRemovalModal from '../UserInvitationRemovalModal.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

const { getMembershipRoles } = getModule('access_control/SpaceMembershipRepository.es6');

export default class UserInvitationDetail extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    inviter: UserPropType.isRequired,
    invitedAt: PropTypes.string.isRequired,
    spaceInvitations: PropTypes.arrayOf(SpaceMembershipPropType),
    type: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired
  };

  revokeInvitation = async () => {
    const { orgId, type, id, email } = this.props;
    const endpoint = createOrganizationEndpoint(orgId);

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <UserInvitationRemovalModal
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}
        email={email}
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

    go({
      path: ['account', 'organizations', 'users', 'invitations']
    });
  };

  render() {
    const { email, role, spaceInvitations, inviter, invitedAt } = this.props;

    return (
      <Workbench className="user-invitation-detail">
        <Workbench.Header>
          <Workbench.Header.Back to="^.invitations" />
          <Workbench.Title>Invitation details</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <div className="user-invitation-detail__main">
            <div className="user-invitation-detail__sidebar">
              <section className="user-invitation-detail__section">
                <h2>{email}</h2>
              </section>
              <section className="user-invitation-detail__section">
                <dl className="user-invitation-detail__definition-list">
                  <dt>Invitation sent</dt>
                  <dd>{moment(invitedAt).format('MMMM D, YYYY')}</dd>
                  <dt>Invited by</dt>
                  <dd>{getUserName(inviter)}</dd>
                </dl>
              </section>
              <section className="user-invitation-detail__section">
                <dl className="user-invitation-detail__definition-list">
                  <dt>Organization role</dt>
                  <dd>{role}</dd>
                </dl>
                <p className="user-invitation-detail__role-description">
                  {getRoleDescription(role)}
                </p>
              </section>
              <Button buttonType="negative" size="small" onClick={() => this.revokeInvitation()}>
                Revoke
              </Button>
            </div>
            <div className="user-invitation-detail__space-invitations">
              <section>
                <header
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between'
                  }}>
                  <h3 style={{ marginBottom: 30 }}>Space memberships</h3>
                  <Tooltip content="Invitations can’t be modified" place="left">
                    <Button size="small" buttonType="primary" disabled>
                      Add to space
                    </Button>
                  </Tooltip>
                </header>
                {Boolean(spaceInvitations.length) && (
                  <Table extraClassNames="user-invitation-detail__table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Space</TableCell>
                        <TableCell>Space roles</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {spaceInvitations.map(invitation => {
                        return (
                          <TableRow key={invitation.sys.id}>
                            <TableCell>{invitation.sys.space.name}</TableCell>
                            <TableCell>
                              {getMembershipRoles(invitation)
                                .map(role => role.name)
                                .join(', ')}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </section>
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
