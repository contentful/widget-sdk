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
    invitation: PropTypes.object
  };

  acceptInvitation = async () => {
    const endpoint = createEndpoint();
    const {
      invitation: {
        organizationName,
        sys: { id: invitationId }
      }
    } = this.props;

    try {
      const acceptedInvitation = await endpoint({
        method: 'POST',
        path: ['organizations', 'invitations', invitationId, 'accept']
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

      if (firstSpaceId) {
        go('spaces.detail', { spaceId: firstSpaceId });
      } else {
        // Just go to home
        go({
          path: ['home']
        });
      }

      Notification.success(`Welcome to the ${organizationName} organization!`);
    } catch (e) {
      Notification.error('An error occurred. Contact the organization manager for more details.');
    }
  };

  render() {
    const {
      invitation: { organizationName, role, inviterName, ssoEnabled }
    } = this.props;

    return (
      <Fullscreen gradient>
        <div className="user-invitation--wrapper">
          <div className="user-invitation--accept">
            <div className="user-invitation--info">
              <h2 className="user-invitation--title">
                Youʼve been invited to the <em>{organizationName}</em> organization in Contentful as
                a {role}
              </h2>
              <p className="user-invitation--inviter">Invited by {inviterName}</p>
              <Button
                buttonType="primary"
                extraClassNames="user-invitation--join-org-button"
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
                {ssoEnabled && (
                  <li>
                    If youʼve logged in via{' '}
                    <a
                      href="https://www.contentful.com/faq/sso/"
                      target="_blank"
                      rel="noopener noreferrer">
                      SSO
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Fullscreen>
    );
  }
}
