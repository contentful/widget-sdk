import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Heading,
  SectionHeading,
  Button,
  Select,
  Option,
  Notification,
  IconButton
} from '@contentful/forma-36-react-components';
import _ from 'lodash';
import * as tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { css, cx } from 'emotion';
import Workbench from 'app/common/Workbench.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createTeamSpaceMembership } from 'access_control/TeamRepository.es6';
import { go } from 'states/Navigator.es6';
import RoleSelector from './RoleSelector.es6';

import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';

const classes = {
  workbench: css({
    display: 'flex'
  }),
  workbenchContent: css({
    width: '800px',
    margin: `${tokens.spacing2Xl} auto 80px`
  }),

  sectionHeading: css({
    color: tokens.colorTextLight
  }),
  teamTitle: css({
    marginBottom: tokens.spacingM
  }),

  select: css({
    marginBottom: tokens.spacingL
  }),

  teamsAndRolesLists: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }),

  teamsContainer: css({
    flexBasis: '60%',
    marginRight: tokens.spacing2Xl
  }),
  teamsList: css({
    height: '450px',
    overflow: 'scroll',
    wordBreak: 'break-word'
  }),

  submitButton: css({
    marginTop: tokens.spacing2Xl
  }),

  rolesContainer: css({
    flexBasis: '40%'
  }),

  teamInfo: {
    container: css({
      padding: `${tokens.spacingM} ${tokens.spacingM} ${tokens.spacingM} ${tokens.spacingXl}`,
      marginBottom: tokens.spacingM,
      color: tokens.colorTextMid,
      '&:hover': {
        backgroundColor: tokens.colorElementLightest,
        '& .team-info__close-button': {
          opacity: 1
        }
      },
      position: 'relative'
    }),
    title: css({
      marginBottom: tokens.spacingXs
    }),
    name: css({
      wordBreak: 'break-word',
      marginRight: tokens.spacingM
    }),
    close: css({
      position: 'absolute',
      right: `10px`,
      top: '10px',
      opacity: 0
    })
  }
};

const makeLink = id => ({ sys: { id, type: 'Link', linkType: 'Role' } });

const closeTabWarning = evt => {
  evt.preventDefault();
  evt.returnValue = '';
};

const reducer = createImmerReducer({
  SELECT_ADMIN: (state, action) => {
    if (action.payload === true) {
      state.selectedRoleIds = [];
    }

    state.adminRoleSelected = action.payload;
  },
  ADD_TEAM: (state, action) => {
    state.selectedTeamIds.push(action.payload);

    state.shouldShowControls = true;

    if (state.selectedTeamIds.length === 1) {
      window.addEventListener('beforeunload', closeTabWarning);
    }
  },
  REMOVE_TEAM: (state, action) => {
    state.selectedTeamIds = state.selectedTeamIds.filter(id => id !== action.payload);

    if (state.selectedTeamIds.length === 0) {
      window.removeEventListener('beforeunload', closeTabWarning);
    }
  },
  SELECT_ROLE: (state, action) => {
    if (action.payload.isSelected) {
      state.selectedRoleIds.push(action.payload.id);
    } else {
      state.selectedRoleIds = state.selectedRoleIds.filter(id => id !== action.payload.id);
    }
  },
  SUBMIT: (state, action) => {
    state.isLoading = action.payload;
  }
});

const submit = async ({ spaceId, teams, selectedTeamIds, selectedRoleIds, adminRoleSelected }) => {
  const endpoint = createSpaceEndpoint(spaceId);

  const erredTeams = [];
  const promises = selectedTeamIds.map(teamId =>
    createTeamSpaceMembership(endpoint, teamId, {
      admin: adminRoleSelected,
      roles: selectedRoleIds.map(makeLink)
    }).catch(() => erredTeams.push(teamId))
  );

  try {
    await Promise.all(promises);
  } catch (e) {
    // Do nothing, we handle the errors after
  }

  // We keep the user on this page and show a notification telling them all the
  // teams erred
  if (erredTeams.length > 0 && erredTeams.length === promises.length) {
    Notification.error(`Could not add ${pluralize('team', erredTeams.length)} to the space.`);

    return;
  }

  // If any teams were successfully added, we show a success message with the number
  // of teams added
  Notification.success(
    `${pluralize(
      'team',
      selectedTeamIds.length - erredTeams.length,
      true
    )} successfully added to space`
  );

  // Show an error notification for any erred teams as well
  erredTeams.forEach(teamId => {
    const team = teams.find(team => team.sys.id === teamId);

    Notification.error(`Could not add ${team.name} to the space.`);
  });

  go({
    path: ['spaces', 'detail', 'settings', 'teams', 'list']
  });
};

export default function AddTeamsPage({ teams, roles, spaceId }) {
  const [state, dispatch] = useReducer(reducer, {
    adminRoleSelected: true,
    selectedTeamIds: [],
    selectedRoleIds: [],
    shouldShowControls: false,
    isLoading: false
  });

  useEffect(() => {
    return () => {
      window.removeEventListener('beforeunload', closeTabWarning);
    };
  }, [spaceId]);

  const {
    adminRoleSelected,
    selectedTeamIds,
    selectedRoleIds,
    shouldShowControls,
    isLoading
  } = state;

  const submitButtonDisabled =
    selectedTeamIds.length === 0 ||
    (adminRoleSelected === false && selectedRoleIds.length === 0) ||
    isLoading;

  return (
    <Workbench className={classes.workbench}>
      <Workbench.Header>
        <Workbench.Header.Back to="spaces.detail.settings.teams.list" />
        <Workbench.Icon icon="page-teams" />
        <Workbench.Title>Add teams</Workbench.Title>
      </Workbench.Header>
      <Workbench.Content>
        <Typography>
          <div className={classes.workbenchContent}>
            <div>
              <Heading>Add teams from your organization</Heading>
              <Select
                disabled={isLoading}
                className={classes.select}
                testId="teams-select"
                onChange={e => dispatch({ type: 'ADD_TEAM', payload: e.target.value })}>
                <Option value="">Select...</Option>
                {teams
                  .filter(team => !selectedTeamIds.includes(team.sys.id))
                  .map(team => (
                    <Option testId={`${team.sys.id}-option`} value={team.sys.id} key={team.sys.id}>
                      {team.name}
                    </Option>
                  ))}
              </Select>
            </div>
            {shouldShowControls && (
              <div data-test-id="teams-and-roles-lists" className={classes.teamsAndRolesLists}>
                <div className={classes.teamsContainer}>
                  <SectionHeading className={cx(classes.sectionHeading, classes.teamTitle)}>
                    {pluralize('team', selectedTeamIds.length, true)}
                  </SectionHeading>
                  <div className={classes.teamsList} data-test-id="teams-list">
                    {selectedTeamIds.length !== 0 &&
                      selectedTeamIds.map(id => {
                        const team = teams.find(t => t.sys.id === id);

                        return (
                          <TeamInfo
                            key={team.sys.id}
                            team={team}
                            onClick={() => dispatch({ type: 'REMOVE_TEAM', payload: id })}
                          />
                        );
                      })}
                  </div>
                  <Button
                    className={classes.submitButton}
                    disabled={submitButtonDisabled}
                    loading={isLoading}
                    testId="submit-button"
                    onClick={async () => {
                      dispatch({ type: 'SUBMIT', payload: true });
                      submit({
                        spaceId,
                        teams,
                        selectedTeamIds,
                        selectedRoleIds,
                        adminRoleSelected
                      });
                      dispatch({ type: 'SUBMIT', payload: false });
                    }}>
                    Add {pluralize('team', selectedTeamIds.length)}
                  </Button>
                </div>
                <div className={classes.rolesContainer}>
                  <SectionHeading className={classes.sectionHeading}>
                    Assign role set to {pluralize('team', selectedTeamIds.length)}
                  </SectionHeading>
                  <RoleSelector
                    roles={roles}
                    onRoleSelected={(id, isSelected) =>
                      dispatch({ type: 'SELECT_ROLE', payload: { id, isSelected } })
                    }
                    onAdminSelected={isSelected =>
                      dispatch({ type: 'SELECT_ADMIN', payload: isSelected })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </Typography>
      </Workbench.Content>
    </Workbench>
  );
}

AddTeamsPage.propTypes = {
  teams: PropTypes.array,
  onSubmit: PropTypes.func,
  roles: PropTypes.array,
  spaceId: PropTypes.string
};

function TeamInfo({ team, onClick }) {
  return (
    <div className={classes.teamInfo.container} data-test-id="team">
      <div className={classes.teamInfo.title}>
        <strong className={classes.teamInfo.name}>{_.truncate(team.name, { length: 25 })}</strong>{' '}
        {pluralize('member', team.memberCount, true)}
      </div>
      <div>{_.truncate(team.description, { length: 60 })}</div>
      <IconButton
        iconProps={{
          icon: 'Close'
        }}
        label="close"
        testId={`${team.sys.id}-close`}
        className={cx(classes.teamInfo.close, 'team-info__close-button')}
        onClick={onClick}
        buttonType="secondary"
      />
    </div>
  );
}

TeamInfo.propTypes = {
  team: PropTypes.object,
  onClick: PropTypes.func
};
