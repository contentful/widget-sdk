import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Placeholder from 'app/common/Placeholder';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import { Button, Tooltip, Subheading, Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import * as Navigator from 'states/Navigator';
import { TeamDialog } from './TeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { DeleteButton } from './TeamDetailsDeleteButton';
import { EditButton } from './TeamDetailsEditButton';
import { TeamDetailsContent } from './TeamDetailsContent';

const ellipsisStyle = {
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: '1.2em',
};

const styles = {
  details: css({
    padding: '1em 2em 2em',
    display: 'flex',
  }),
  detailsContent: css({
    flex: 1,
  }),
  sidebar: css({
    marginRight: '25px',
    width: '400px',
  }),
  profileSection: css({
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    paddingBottom: '20px',
    marginBottom: '20px',
  }),
  card: css({
    '> *': {
      marginBottom: '1rem',
    },
  }),
  name: css(ellipsisStyle),
  description: css(ellipsisStyle),
};

TeamDetails.propTypes = {
  team: TeamPropType.isRequired,
  orgId: PropTypes.string.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
  emptyTeamMemberships: PropTypes.bool,
  emptyTeamSpaceMemberships: PropTypes.bool,
  noOrgMembersLeft: PropTypes.bool,
  allTeams: PropTypes.objectOf(TeamPropType),
};

export function TeamDetails({ team, allTeams, orgId, readOnlyPermission }) {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [teamDescription, setTeamDescription] = useState(team.description);
  const path = ['account', 'organizations', 'teams'];

  const onUpdateTeamDetailsValues = ({ name, description }) => {
    setTeamName(name);
    setTeamDescription(description);
  };

  return (
    <Workbench testId="organization-team-page">
      <Workbench.Header
        testId="link-to-list"
        onBack={() => {
          Navigator.go({ path });
        }}
        title="Teams"
      />
      <Workbench.Content>
        {team && (
          <div className={styles.details} data-test-id="team-details">
            <div className={styles.sidebar}>
              <section className={styles.profileSection}>
                <div className={styles.card}>
                  <Subheading className={styles.name} testId="team-card-name" title={team.name}>
                    {teamName}
                  </Subheading>
                  {teamDescription && (
                    <div
                      className={styles.description}
                      data-test-id="team-card-description"
                      title={teamDescription}>
                      {teamDescription.split('\n').reduce((acc, cur, idx) => {
                        if (idx === 0) {
                          return [...acc, cur];
                        }
                        return [...acc, <br key={idx} />, cur];
                      }, [])}
                    </div>
                  )}
                  {readOnlyPermission ? (
                    <Tooltip
                      testId="read-only-tooltip"
                      place="right"
                      content="You don't have permission to edit team details">
                      <EditButton />
                    </Tooltip>
                  ) : (
                    <EditButton onClick={() => setShowTeamDialog(true)} />
                  )}
                </div>
              </section>
              {team.sys && (
                <section className={styles.profileSection}>
                  <dl className="definition-list">
                    <dt>Created at</dt>
                    <dd data-test-id="creation-date">
                      {moment(team.sys.createdAt).format('MMMM DD, YYYY')}
                    </dd>
                    {!readOnlyPermission && (
                      <React.Fragment>
                        <dt>Created by</dt>
                        <dd data-test-id="creator-name">{getUserName(team.sys.createdBy)}</dd>
                      </React.Fragment>
                    )}
                  </dl>
                </section>
              )}
              {readOnlyPermission ? (
                <Tooltip
                  testId="read-only-tooltip"
                  place="right"
                  content="You don't have permission to delete a team">
                  <DeleteButton />
                </Tooltip>
              ) : (
                <DeleteButton onClick={() => setShowDeleteTeamDialog(true)} />
              )}
            </div>
            <div className={styles.detailsContent}>
              <TeamDetailsContent
                team={team}
                orgId={orgId}
                readOnlyPermission={readOnlyPermission}
              />
            </div>
          </div>
        )}
        {!team && (
          <Placeholder
            testId="not-found-placeholder"
            title="The team you were looking for was not found 🔎"
            text="It might have been deleted or you lost permission to see it"
            button={
              <Button
                href={() => {
                  Navigator.go({ path });
                }}>
                Go to team list
              </Button>
            }
          />
        )}
        <TeamDialog
          testId="edit-team-dialog"
          onClose={() => setShowTeamDialog(false)}
          isShown={showTeamDialog}
          initialTeam={team}
          allTeams={allTeams}
          updateTeamDetailsValues={onUpdateTeamDetailsValues}
        />
        <DeleteTeamDialog
          testId="edit-team-dialog"
          onClose={() => setShowDeleteTeamDialog(false)}
          isShown={showDeleteTeamDialog}
          initialTeam={team}
          allTeams={allTeams}
          updateTeamDetailsValues={onUpdateTeamDetailsValues}
        />
      </Workbench.Content>
    </Workbench>
  );
}
