import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Heading,
  SectionHeading,
  Button,
  Select,
  Option,
  FieldGroup,
  RadioButtonField,
  CheckboxField,
  Notification
} from '@contentful/forma-36-react-components';
import _ from 'lodash';
import * as tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { css } from 'emotion';
import Workbench from 'app/common/Workbench.es6';
import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createTeamSpaceMembership } from 'access_control/TeamRepository.es6';
import { go } from 'states/Navigator.es6';

import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';

const classes = {
  hero: css({
    marginBottom: tokens.spacingL
  }),
  workbench: css({
    display: 'flex'
  }),
  workbenchContent: css({
    width: '800px',
    margin: `${tokens.spacing2Xl} auto 80px`
  }),
  container: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }),
  sectionHeading: css({
    color: tokens.colorTextLight
  }),
  teams: {
    container: css({
      flexBasis: '73%',
      marginRight: tokens.spacingL
    }),
    list: css({
      height: '350px',
      overflow: 'scroll',
      wordBreak: 'break-word',
      marginLeft: tokens.spacingL
    })
  },
  roles: {
    container: css({
      flexBasis: '27%'
    }),
    list: css({
      marginLeft: '20px',
      wordBreak: 'break-word'
    }),
    item: css({
      display: 'block',
      marginBottom: tokens.spacingXs
    })
  },
  addTeams: {
    workbench: css({
      display: 'flex'
    }),
    container: css({
      width: '800px',
      margin: '0 auto 80px'
    }),
    select: css({
      marginBottom: tokens.spacingL
    })
  },
  teamInfo: {
    container: css({
      padding: tokens.spacingM,
      marginBottom: tokens.spacingM,
      color: tokens.colorTextMid,
      '&:hover': {
        backgroundColor: tokens.colorElementLightest,
        cursor: 'pointer'
      }
    }),
    title: css({
      marginBottom: tokens.spacingXs
    }),
    name: css({
      wordBreak: 'break-word',
      marginRight: tokens.spacingM
    })
  }
};

const closeTabWarning = evt => {
  evt.preventDefault();
  evt.returnValue = '';
};

const reducer = createImmerReducer({
  SET_ADMIN: (state, action) => {
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
  CHECK_ROLE: (state, action) => {
    if (action.payload.checked) {
      state.selectedRoleIds.push(action.payload.id);
    } else {
      state.selectedRoleIds = state.selectedRoleIds.filter(id => id !== action.payload.id);
    }
  },
  SUBMIT: (state, action) => {
    state.isLoading = action.payload;
  }
});

const submit = (spaceId, teams, dispatch) => async ({
  selectedTeamIds,
  selectedRoleIds,
  adminRoleSelected
}) => {
  const endpoint = createSpaceEndpoint(spaceId);

  dispatch({ type: 'SUBMIT', payload: true });

  const erredTeams = [];
  const promises = selectedTeamIds.map(teamId =>
    createTeamSpaceMembership(endpoint, teamId, {
      admin: adminRoleSelected,
      roles: selectedRoleIds.map(id => ({ sys: { id, type: 'Link', linkType: 'Role' } }))
    }).catch(() => erredTeams.push(teamId))
  );

  try {
    await Promise.all(promises);
  } catch (e) {
    // Do nothing, we handle the errors after
  }

  if (erredTeams.length > 0 && erredTeams.length === promises.length) {
    Notification.error(`Could not add ${pluralize('team', erredTeams.length)} to the space.`);

    dispatch({ type: 'SUBMIT', payload: false });

    return;
  }

  Notification.success(
    `${pluralize(
      'team',
      selectedTeamIds.length - erredTeams.length,
      true
    )} successfully added to space`
  );

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

  const [, doSubmit] = useAsyncFn(submit(spaceId, teams, dispatch));

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
            <div className={classes.hero}>
              <Heading>Add teams from your organization</Heading>
              <Select
                disabled={isLoading}
                className={classes.addTeams.select}
                onChange={e => dispatch({ type: 'ADD_TEAM', payload: e.target.value })}>
                <Option>Select...</Option>
                {teams
                  .filter(team => !selectedTeamIds.includes(team.sys.id))
                  .map(team => (
                    <Option value={team.sys.id} key={team.sys.id}>
                      {team.name}
                    </Option>
                  ))}
              </Select>
            </div>
            <div className={classes.container}>
              <div className={classes.teams.container}>
                {shouldShowControls && (
                  <>
                    <SectionHeading className={classes.sectionHeading}>
                      {pluralize('team', selectedTeamIds.length, true)}
                    </SectionHeading>
                    <div className={classes.teams.list}>
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
                      disabled={submitButtonDisabled}
                      loading={isLoading}
                      onClick={() => doSubmit(state)}>
                      Add teams
                    </Button>
                  </>
                )}
              </div>
              <div className={classes.roles.container}>
                {shouldShowControls && (
                  <>
                    <SectionHeading className={classes.sectionHeading}>
                      Assign role set to {pluralize('team', selectedTeamIds.length)}
                    </SectionHeading>
                    <FieldGroup>
                      <RadioButtonField
                        labelText="Admin"
                        helpText="Manages everything in the space"
                        name="admin"
                        id="admin_true"
                        value={true}
                        checked={adminRoleSelected === true}
                        disabled={isLoading}
                        onChange={() => dispatch({ type: 'SET_ADMIN', payload: true })}
                      />
                      <RadioButtonField
                        labelText="Non-admin"
                        name="admin"
                        id="admin_false"
                        value={false}
                        checked={adminRoleSelected === false}
                        disabled={isLoading}
                        onChange={() => dispatch({ type: 'SET_ADMIN', payload: false })}
                      />
                      <div className={classes.roles.list}>
                        {roles.map(role => (
                          <div key={role.sys.id} className={classes.roles.item}>
                            <CheckboxField
                              id={role.sys.id}
                              labelText={role.name}
                              checked={Boolean(selectedRoleIds.find(id => role.sys.id === id))}
                              disabled={adminRoleSelected === true || isLoading}
                              onChange={e =>
                                dispatch({
                                  type: 'CHECK_ROLE',
                                  payload: {
                                    checked: e.target.checked,
                                    id: role.sys.id
                                  }
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </FieldGroup>
                  </>
                )}
              </div>
            </div>
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
    <div className={classes.teamInfo.container} onClick={onClick}>
      <div className={classes.teamInfo.title}>
        <strong className={classes.teamInfo.name}>{_.truncate(team.name, { length: 25 })}</strong>{' '}
        {pluralize('member', team.memberCount, true)}
      </div>
      <div>{_.truncate(team.description, { length: 60 })}</div>
    </div>
  );
}

TeamInfo.propTypes = {
  team: PropTypes.object,
  onClick: PropTypes.func
};
