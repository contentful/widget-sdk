import React from 'react';
import PropTypes from 'prop-types';
import Fullscreen from 'components/shared/Fullscreen.es6';
import { Button } from '@contentful/forma-36-react-components';
import { get } from 'lodash';
import { createEndpoint } from 'data/EndpointFactory.es6';
import { Notification } from '@contentful/ui-component-library';
import { go } from 'states/Navigator.es6';
import { refresh as refreshToken } from 'services/TokenStore.es6';

export default class UserInvitation extends React.Component {
  static propTypes = {
    invitation: PropTypes.shape({
      organizationName: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      inviterName: PropTypes.string.isRequired
    }),
    errored: PropTypes.bool
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
        Notification.success(`Welcome to the ${organizationName} organization!`);
      });
    } catch (e) {
      this.setState({
        accepting: false
      });

      Notification.error(
        'Your invitation didnʼt go through. Let your organization admin know about it, and they can invite you again.'
      );
    }
  };

  render() {
    const { invitation, errored } = this.props;
    const { accepting } = this.state;

    const organizationName = get(invitation, 'organizationName');
    const role = get(invitation, 'role');
    const inviterName = get(invitation, 'inviterName');

    return (
      <Fullscreen gradient>
        <div className="user-invitation--wrapper">
          <div className="user-invitation--box">
            {errored && (
              <React.Fragment>
                <div className="user-invitation--error">
                  <h2 className="user-invitation--title">Oops... This invitation doesnʼt exist.</h2>
                  <p className="user-invitation--error-details">Itʼs either deleted or expired.</p>
                </div>
              </React.Fragment>
            )}
            {!errored && (
              <React.Fragment>
                <div className="user-invitation--info">
                  <h2 className="user-invitation--title">
                    Youʼve been invited to the <em>{organizationName}</em> organization in
                    Contentful as a {role}
                  </h2>
                  <p className="user-invitation--inviter">Invited by {inviterName}</p>
                  <Button
                    buttonType="primary"
                    extraClassNames="user-invitation--join-org-button"
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
                      <a
                        href="https://www.contentful.com/r/knowledgebase/spaces-and-organizations/"
                        target="_blank"
                        rel="noopener noreferrer">
                        roles and permissions
                      </a>{' '}
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
