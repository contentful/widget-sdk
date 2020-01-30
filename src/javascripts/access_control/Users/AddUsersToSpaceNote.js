import React from 'react';
import PropTypes from 'prop-types';
import { TextLink, Paragraph, Typography } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';

import StateLink from 'app/common/StateLink';

const AddUsersToSpaceNote = ({ orgId, isOwnerOrAdmin, hasTeamsFeature }) => (
  <Typography>
    {hasTeamsFeature && (
      <Paragraph>
        To add a group of users with the same role, try{' '}
        <StateLink
          component={TextLink}
          path="spaces.detail.settings.teams.list"
          onClick={() => {
            track('teams_in_space:users_to_teams_page_navigation');
          }}>
          adding a team
        </StateLink>
      </Paragraph>
    )}
    <Paragraph>
      To add users and teams to this space, they must already be a member of the organization
      {!isOwnerOrAdmin && <span>, and invited by an organization owner or admin</span>}
      {isOwnerOrAdmin && (
        <span>
          . Invite new users and teams to the organization from the{' '}
          <StateLink
            component={TextLink}
            path="account.organizations.users.list"
            params={{ orgId }}>
            organization settings
          </StateLink>
        </span>
      )}
      .
    </Paragraph>
    {hasTeamsFeature && (
      <Paragraph>
        Some users of this space may have access through a team. In this case, it is only possible
        to manage the settings of the team, rather than the individual users.
      </Paragraph>
    )}
    {!hasTeamsFeature && !isOwnerOrAdmin && (
      <Paragraph>
        It is possible to add a group of users with the same role through the teams feature. To
        access the teams feature, talk with your organization admin.
      </Paragraph>
    )}
    {!hasTeamsFeature && isOwnerOrAdmin && (
      <Paragraph>
        It is possible to add a group of users with the same role through the{' '}
        <StateLink component={TextLink} path="account.organizations.teams" params={{ orgId }}>
          teams feature
        </StateLink>
        . To access the teams feature, talk with your organization admin.
      </Paragraph>
    )}
  </Typography>
);

export default AddUsersToSpaceNote;

AddUsersToSpaceNote.propTypes = {
  orgId: PropTypes.string.isRequired,
  isOwnerOrAdmin: PropTypes.bool.isRequired,
  hasTeamsFeature: PropTypes.bool
};
