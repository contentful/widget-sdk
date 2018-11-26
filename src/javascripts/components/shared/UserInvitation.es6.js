import React from 'react';
import PropTypes from 'prop-types';
import Fullscreen from 'components/shared/Fullscreen.es6';
import { Button } from '@contentful/forma-36-react-components';

export default class UserInvitation extends React.Component {
  static propTypes = {
    invitation: PropTypes.object
  };

  render() {
    const {
      invitation: { orgName, orgRole, inviterName, ssoEnabled }
    } = this.props;

    return (
      <Fullscreen gradient>
        <div className="user-invitation--wrapper">
          <div className="user-invitation--accept">
            <p>
              <h2 className="user-invitation--title">
                Youʼve been invited to the <em>{orgName}</em> organization in Contentful as a{' '}
                {orgRole}
              </h2>
              <p className="user-invitation--inviter">Invited by {inviterName}</p>
              <Button buttonType="primary" extraClassNames="user-invitation--join-org-button">
                Join {orgName}
              </Button>
            </p>
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
