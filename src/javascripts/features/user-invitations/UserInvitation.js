import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Fullscreen } from './components/Fullscreen';
import { Button, Heading, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { get } from 'lodash';
import { createEndpoint } from 'data/EndpointFactory';
import { Notification } from '@contentful/forma-36-react-components';
import { go } from 'states/Navigator';
import {
  refresh as refreshToken,
  getOrganization,
  getOrganizationSpaces,
} from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { article } from 'utils/StringUtils';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { User as UserPropType } from 'app/OrganizationSettings/PropTypes';
import { logError } from 'services/logger';

export function UserInvitation(props) {
  const [accepting, setAccepting] = useState(false);

  const { invitation = {}, errored, user = {} } = props;
  const { organizationName, role, inviterName } = invitation;
  const { email } = user;

  async function acceptInvitation() {
    const endpoint = createEndpoint();
    const {
      invitation: {
        organizationName,
        sys: { id: invitationId },
      },
    } = props;

    setAccepting(true);

    try {
      // TODO: there's too much happening in this try block. We should split this into smaller chunks of functionality
      // TODO: this needs unit tests!
      const acceptedInvitation = await endpoint({
        method: 'POST',
        path: ['invitations', invitationId, 'accept'],
      });

      await refreshToken();

      let firstSpaceId = get(acceptedInvitation, [
        'spaceInvitations',
        0,
        'sys',
        'space',
        'sys',
        'id',
      ]);

      if (!firstSpaceId) {
        //the user might have access to spaces through team memberships
        const orgId = get(acceptedInvitation, 'sys.organization.sys.id');
        const spaces = await getOrganizationSpaces(orgId);
        firstSpaceId = get(spaces, '[0].sys.id', null);
      }

      const navMeta = {};

      if (firstSpaceId) {
        navMeta.path = ['spaces', 'detail'];
        navMeta.params = { spaceId: firstSpaceId };
      } else {
        // Just go to home
        const orgId = get(acceptedInvitation, 'sys.organization.sys.id');
        const org = await getOrganization(orgId);
        const orgOwnerOrAdmin = isOwnerOrAdmin(org);
        navMeta.path = ['home'];
        navMeta.params = { orgId: orgId, orgOwnerOrAdmin: orgOwnerOrAdmin };
      }

      go(navMeta).then(() => {
        Notification.success(`Welcome to the "${organizationName}" organization!`);
      });
    } catch (e) {
      setAccepting(false);

      const errorMessageText = e.data && e.data.message;

      if (errorMessageText) {
        Notification.error(`${errorMessageText}`);
      } else {
        logError('Unable to accept org invitation', { error: e });
        Notification.error(
          'Your invitation didn’t go through. Ask your Contentful organization admin to invite you again.'
        );
      }
    }
  }

  return (
    <Fullscreen gradient>
      <div className="user-invitation--wrapper">
        <div className="user-invitation--box">
          {errored && (
            <React.Fragment>
              <div className="user-invitation--error">
                <Icon name="invitation-not-found" />
                <Heading element="h2" className="user-invitation--title">
                  This invitation doesn’t exist.
                </Heading>
                <Paragraph className="user-invitation--error-details">
                  If you’ve arrived here by accident, it means that you may have been invited with
                  an email different than the one you’re logged in with — <strong>{email}</strong>.
                  Ask the person who sent you the invitation if they can invite you with this email.
                </Paragraph>
              </div>
            </React.Fragment>
          )}
          {!errored && (
            <React.Fragment>
              <div className="user-invitation--info">
                <Heading element="h2" className="user-invitation--title">
                  You’ve been invited to the <em>{organizationName}</em> organization in Contentful
                  as {article(role)} {role}
                </Heading>
                <Paragraph className="user-invitation--inviter">Invited by {inviterName}</Paragraph>
                <Button
                  buttonType="primary"
                  className="user-invitation--join-org-button"
                  disabled={accepting}
                  loading={accepting}
                  onClick={acceptInvitation}>
                  Join {organizationName}
                </Button>
              </div>
              <div className="user-invitation--org-details">
                <Paragraph>Owners and admins of this organization will be able to see:</Paragraph>

                <List>
                  <ListItem>Your name and profile picture</ListItem>
                  <ListItem> Last time that you were active within the organization</ListItem>
                  <ListItem>
                    Your{' '}
                    <KnowledgeBase
                      target="spacesAndOrganizations"
                      text="roles and permissions"
                      icon={false}
                    />{' '}
                    in spaces within the organization
                  </ListItem>
                </List>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    </Fullscreen>
  );
}

UserInvitation.propTypes = {
  invitation: PropTypes.shape({
    organizationName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    inviterName: PropTypes.string.isRequired,
    sys: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
  errored: PropTypes.bool,
  user: UserPropType,
};
