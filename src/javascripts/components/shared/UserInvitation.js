import React from 'react';
import PropTypes from 'prop-types';
import Fullscreen from 'components/shared/Fullscreen';
import { Button } from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { get } from 'lodash';
import { createEndpoint } from 'data/EndpointFactory';
import { Notification } from '@contentful/forma-36-react-components';
import { go } from 'states/Navigator';
import { refresh as refreshToken } from 'services/TokenStore';
import { article } from 'utils/StringUtils';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { User as UserPropType } from 'app/OrganizationSettings/PropTypes';

export default class UserInvitation extends React.Component {
  static propTypes = {
    invitation: PropTypes.shape({
      organizationName: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      inviterName: PropTypes.string.isRequired,
      sys: PropTypes.shape({
        id: PropTypes.string
      })
    }),
    errored: PropTypes.bool,
    user: UserPropType
  };

  state = {
    accepting: false
  };

  acceptInvitation = async () => {
    const endpoint = createEndpoint();
    const {
      invitation: {
        organizationName,
        sys: { id: invitationId }
      }
    } = this.props;

    this.setState({
      accepting: true
    });

    try {
      const acceptedInvitation = await endpoint({
        method: 'POST',
        path: ['invitations', invitationId, 'accept']
      });

      await refreshToken();

      const firstSpaceId = get(acceptedInvitation, [
        'spaceInvitations',
        0,
        'sys',
        'space',
        'sys',
        'id'
      ]);

      const navMeta = {};

      if (firstSpaceId) {
        navMeta.path = ['spaces', 'detail'];
        navMeta.params = { spaceId: firstSpaceId };
      } else {
        // Just go to home
        navMeta.path = ['home'];
      }

      go(navMeta).then(() => {
        Notification.success(`Welcome to the "${organizationName}" organization!`);
      });
    } catch (e) {
      this.setState({
        accepting: false
      });

      Notification.error(
        'Your invitation didn’t go through. Ask your Contentful organization admin to invite you again.'
      );
    }
  };

  render() {
    const { invitation = {}, errored, user = {} } = this.props;
    const { organizationName, role, inviterName } = invitation;
    const { email } = user;
    const { accepting } = this.state;

    return (
      <Fullscreen gradient>
        <div className="user-invitation--wrapper">
          <div className="user-invitation--box">
            {errored && (
              <React.Fragment>
                <div className="user-invitation--error">
                  <Icon name="invitation-not-found" />
                  <h2 className="user-invitation--title">This invitation doesn’t exist.</h2>
                  <p className="user-invitation--error-details">
                    If you’ve arrived here by accident, it means that you may have been invited with
                    an email different than the one you’re logged in with — <strong>{email}</strong>
                    . Ask the person who sent you the invitation if they can invite you with this
                    email.
                  </p>
                </div>
              </React.Fragment>
            )}
            {!errored && (
              <React.Fragment>
                <div className="user-invitation--info">
                  <h2 className="user-invitation--title">
                    You’ve been invited to the <em>{organizationName}</em> organization in
                    Contentful as {article(role)} {role}
                  </h2>
                  <p className="user-invitation--inviter">Invited by {inviterName}</p>
                  <Button
                    buttonType="primary"
                    className="user-invitation--join-org-button"
                    disabled={accepting}
                    loading={accepting}
                    onClick={this.acceptInvitation}>
                    Join {organizationName}
                  </Button>
                </div>
                <div className="user-invitation--org-details">
                  <p>Owners and admins of this organization will be able to see:</p>

                  <ul>
                    <li>Your name and profile picture</li>
                    <li>Last time that you were active within the organization</li>
                    <li>
                      Your{' '}
                      <KnowledgeBase
                        target="spacesAndOrganizations"
                        text="roles and permissions"
                        icon={false}
                      />{' '}
                      in spaces within the organization
                    </li>
                  </ul>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </Fullscreen>
    );
  }
}
