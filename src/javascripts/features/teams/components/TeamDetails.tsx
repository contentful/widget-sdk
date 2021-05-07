import React, { useCallback, useState } from 'react';
import moment from 'moment';
import Placeholder from 'app/common/Placeholder';
import {
  Button,
  Grid,
  Heading,
  Paragraph,
  Tooltip,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { TeamDialog } from './TeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { DeleteButton } from './TeamDetailsDeleteButton';
import { EditButton } from './TeamDetailsEditButton';
import { TeamDetailsContent } from './TeamDetailsContent';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getUser } from 'access_control/OrganizationMembershipRepository';
import { useAsync } from 'core/hooks';
import { Team } from '../types';
import { Interpolation } from '@emotion/serialize';
import { RouteLink, useRouteNavigate } from 'core/react-routing';

const ellipsisStyle: Interpolation = {
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: '1.2em',
};

const styles = {
  details: css({
    padding: `${tokens.spacingM} ${tokens.spacingXl} ${tokens.spacingXl}`,
    display: 'flex',
    flexDirection: 'column',
  }),
  detailsContent: css({
    width: '100%',
  }),
  profileSection: css({
    marginBottom: tokens.spacing2Xl,
  }),
  column: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    paddingTop: tokens.spacingL,
    color: tokens.colorTextMid,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }),
  columnContent: css({
    marginBottom: tokens.spacingXl,
  }),
  columnActions: css({
    display: 'flex',
  }),
  editButton: css({
    marginRight: tokens.spacingS,
  }),
  teamCard: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    maxWidth: '400px',
  }),
  name: css(ellipsisStyle),
  description: css(ellipsisStyle),
};

type Props = {
  team: Team;
  orgId: string;
  readOnlyPermission: boolean;
};

export function TeamDetails({ team, orgId, readOnlyPermission }: Props) {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [teamDescription, setTeamDescription] = useState(team.description);
  const navigate = useRouteNavigate();

  const createdById = team.sys.createdBy?.sys.id;
  const getCreatorName = useCallback(async () => {
    const { firstName, lastName } = await getUser(createOrganizationEndpoint(orgId), createdById);
    return `${firstName} ${lastName}`;
  }, [createdById, orgId]);

  const { data: teamCreator } = useAsync(getCreatorName);

  const onUpdateTeamDetailsValues = ({ name, description }) => {
    setTeamName(name);
    setTeamDescription(description);
  };

  return (
    <Workbench testId="organization-team-page">
      <Workbench.Header
        testId="link-to-list"
        onBack={() => navigate({ path: 'organizations.teams', orgId })}
        title="Teams"
      />
      <Workbench.Content>
        {team && (
          <div className={styles.details} data-test-id="team-details">
            <section className={styles.profileSection}>
              <div className={styles.teamCard}>
                <Typography>
                  <Heading
                    element="h2"
                    className={styles.name}
                    testId="team-card-name"
                    title={team.name}>
                    {teamName}
                  </Heading>
                  {teamDescription && (
                    <Paragraph
                      className={styles.description}
                      data-test-id="team-card-description"
                      title={teamDescription}>
                      {teamDescription.split('\n').reduce((acc, cur, idx) => {
                        if (idx === 0) {
                          return [...acc, cur];
                        }
                        return [...acc, <br key={idx} />, cur];
                      }, [] as React.ReactNodeArray)}
                    </Paragraph>
                  )}
                </Typography>
              </div>
              <Grid columns={3} rows={1} columnGap="spacingL" flow="row">
                <div className={styles.column}>
                  <>
                    <div className={styles.columnContent}>
                      <dl className="definition-list">
                        <dt>Created at</dt>
                        <dd data-test-id="creation-date">
                          {moment(team.sys.createdAt).format('MMMM DD, YYYY')}
                        </dd>
                        {!readOnlyPermission && (
                          <>
                            <dt>Created by</dt>
                            <dd data-test-id="creator-name">{teamCreator}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </>
                  <div className={styles.columnActions}>
                    {readOnlyPermission ? (
                      <Tooltip
                        testId="read-only-tooltip"
                        place="right"
                        content="You don't have permission to edit team details">
                        <EditButton />
                      </Tooltip>
                    ) : (
                      <div className={styles.editButton}>
                        <EditButton onClick={() => setShowTeamDialog(true)} />
                      </div>
                    )}
                    {team.sys && (
                      <>
                        {readOnlyPermission ? (
                          <Tooltip
                            testId="read-only-tooltip"
                            place="right"
                            content="You don't have permission to delete a team">
                            <DeleteButton />
                          </Tooltip>
                        ) : (
                          <div>
                            <DeleteButton onClick={() => setShowDeleteTeamDialog(true)} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Grid>
            </section>
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
              <RouteLink route={{ path: 'organizations.teams', orgId }} as={Button}>
                Go to team list
              </RouteLink>
            }
          />
        )}
        <TeamDialog
          onClose={() => setShowTeamDialog(false)}
          isShown={showTeamDialog}
          initialTeam={team}
          updateTeamDetailsValues={onUpdateTeamDetailsValues}
        />
        <DeleteTeamDialog
          onClose={() => setShowDeleteTeamDialog(false)}
          isShown={showDeleteTeamDialog}
          initialTeam={team}
        />
      </Workbench.Content>
    </Workbench>
  );
}
