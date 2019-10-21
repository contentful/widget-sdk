import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { track } from 'analytics/Analytics';
import { go } from 'states/Navigator.es6';

import StateLink from 'app/common/StateLink.es6';

const styles = {
  note: css({
    color: tokens.colorTextMid,
    marginTop: tokens.spacingL,
    p: {
      marginBottom: tokens.spacingM
    },
    a: {
      cursor: 'pointer'
    }
  })
};

const goToTeamsPage = () => {
  track('teams_in_space:users_to_teams_page_navigation');

  go({
    path: ['spaces', 'detail', 'settings', 'teams', 'list']
  });
};

const AddUsersToSpaceNote = ({ orgId, isOwnerOrAdmin, hasTeamsFeature }) => (
  <div className={styles.note}>
    {hasTeamsFeature && (
      <p>
        To add a group of users with the same role, try{' '}
        <TextLink onClick={() => goToTeamsPage()}>adding a team</TextLink>.
      </p>
    )}
    <p>
      To add users and teams to this space, they must already be a member of the organization
      {!isOwnerOrAdmin && <span>, and invited by an organization owner or admin</span>}
      {isOwnerOrAdmin && (
        <span>
          . Invite new users and teams to the organization from the{' '}
          <StateLink to="account.organizations.users.list" params={{ orgId }}>
            organization settings
          </StateLink>
        </span>
      )}
      .
    </p>
    {hasTeamsFeature && (
      <p>
        Some users of this space may have access through a team. In this case, it is only possible
        to manage the settings of the team, rather than the individual users.
      </p>
    )}
    {!hasTeamsFeature && !isOwnerOrAdmin && (
      <p>
        It is possible to add a group of users with the same role through the teams feature. To
        access the teams feature, talk with your organization admin.
      </p>
    )}
    {!hasTeamsFeature && isOwnerOrAdmin && (
      <p>
        It is possible to add a group of users with the same role through the{' '}
        <StateLink to="account.organizations.teams" params={{ orgId }}>
          teams feature
        </StateLink>
        . To access the teams feature, talk with your organization admin.
      </p>
    )}
  </div>
);

export default AddUsersToSpaceNote;

AddUsersToSpaceNote.propTypes = {
  orgId: PropTypes.string.isRequired,
  isOwnerOrAdmin: PropTypes.bool.isRequired,
  hasTeamsFeature: PropTypes.bool
};
