import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Heading,
  SectionHeading,
  Button,
  Notification,
  IconButton,
  Subheading,
  HelpText
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import _ from 'lodash';
import * as tokens from '@contentful/forma-36-tokens';
import pluralize from 'pluralize';
import { css, cx } from 'emotion';

import Autocomplete from 'app/common/Autocomplete';
import { useAsyncFn } from 'app/common/hooks/useAsync';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { createTeamSpaceMembership } from 'access_control/TeamRepository';
import { go } from 'states/Navigator';
import { createImmerReducer } from 'redux/utils/createImmerReducer';
import EmptyStateTeams from 'svg/empty-state-teams';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import StateLink from 'app/common/StateLink';
import { track } from 'analytics/Analytics';

import RoleSelector from './RoleSelector';
import Icon from 'ui/Components/Icon';

const styles = {
  workbench: css({
    display: 'flex'
  }),
  workbenchContent: css({
    width: '800px',
    margin: `${tokens.spacing2Xl} auto 80px`
  }),

  sectionHeading: css({
    color: tokens.colorTextLight,
    padding: `0 0 ${tokens.spacingM} 0`,
    marginBottom: tokens.spacingL,
    borderBottom: `1px solid ${tokens.colorElementDark}`
  }),
  teamTitle: css({
    marginBottom: tokens.spacingM
  }),

  select: css({
    width: '100%'
  }),

  selectHelp: css({
    marginTop: tokens.spacingS
  }),

  teamsAndRolesLists: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing2Xl
  }),

  teamsContainer: css({
    flexBasis: '60%',
    marginRight: '100px'
  }),
  teamsList: css({
    wordBreak: 'break-word'
  }),

  submitButton: css({
    marginTop: tokens.spacing3Xl
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
      position: 'relative',
      margin: 0
    }),
    title: css({
      marginBottom: tokens.spacingS
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
  },

  autocompleteTeam: {
    title: css({
      marginBottom: tokens.spacingXs
    }),
    name: css({
      wordBreak: 'break-word',
      marginRight: tokens.spacingM
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

    state.adminSelected = action.payload;
  },
  ADD_TEAM: (state, action) => {
    state.selectedTeamIds.push(action.payload);

    state.shouldShowControls = true;
    state.searchTerm = '';

    if (state.selectedTeamIds.length === 1) {
      window.addEventListener('beforeunload', closeTabWarning);
    }
  },
  REMOVE_TEAM: (state, action) => {
    state.selectedTeamIds = _.pull(state.selectedTeamIds, action.payload);

    if (state.selectedTeamIds.length === 0) {
      window.removeEventListener('beforeunload', closeTabWarning);
    }
  },
  SELECT_ROLE: (state, action) => {
    if (action.payload.isSelected) {
      state.selectedRoleIds.push(action.payload.id);
    } else {
      state.selectedRoleIds = _.pull(state.selectedRoleIds, action.payload.id);
    }
  },
  SUBMIT: (state, action) => {
    state.isLoading = action.payload;
  },
  SEARCH: (state, action) => {
    state.searchTerm = action.payload.toLowerCase();
  }
});

const submit = (spaceId, teams, dispatch) => async ({
  selectedTeamIds,
  selectedRoleIds,
  adminSelected
}) => {
  const endpoint = createSpaceEndpoint(spaceId);

  dispatch({ type: 'SUBMIT', payload: true });

  const erredTeams = [];
  const promises = selectedTeamIds.map(teamId =>
    createTeamSpaceMembership(endpoint, teamId, {
      admin: adminSelected,
      roles: selectedRoleIds.map(makeLink)
    }).catch(() => erredTeams.push(teamId))
  );

  await Promise.all(promises);

  // We keep the user on this page and show a notification telling them all the
  // teams erred
  if (erredTeams.length > 0 && erredTeams.length === promises.length) {
    Notification.error(`Could not add ${pluralize('team', erredTeams.length)} to the space.`);

    dispatch({ type: 'SUBMIT', payload: false });

    track('teams_in_space:teams_added', {
      numErr: erredTeams.length,
      numSuccess: 0,
      numRoles: selectedRoleIds.length,
      adminSelected
    });

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

  track('teams_in_space:teams_added', {
    numErr: erredTeams.length,
    numSuccess: selectedTeamIds.length - erredTeams.length,
    numRoles: selectedRoleIds.length,
    adminSelected
  });

  go({
    path: ['spaces', 'detail', 'settings', 'teams', 'list']
  });
};

export default function AddTeamsPage({ teams, teamSpaceMemberships, roles, spaceId }) {
  const [state, dispatch] = useReducer(reducer, {
    adminSelected: true,
    selectedTeamIds: [],
    selectedRoleIds: [],
    shouldShowControls: false,
    isLoading: false,
    searchTerm: ''
  });

  const [, doSubmit] = useAsyncFn(submit(spaceId, teams, dispatch));

  useEffect(() => {
    return () => {
      window.removeEventListener('beforeunload', closeTabWarning);
    };
  }, []);

  const {
    adminSelected,
    selectedTeamIds,
    selectedRoleIds,
    shouldShowControls,
    isLoading,
    searchTerm
  } = state;

  const submitButtonDisabled =
    selectedTeamIds.length === 0 ||
    (adminSelected === false && selectedRoleIds.length === 0) ||
    isLoading;

  const availableTeams = teams.filter(
    team => !teamSpaceMemberships.find(tsm => tsm.sys.team.sys.id === team.sys.id)
  );

  const teamsInAutocomplete = _(availableTeams)
    .filter(
      team => !selectedTeamIds.includes(team.sys.id) && team.name.toLowerCase().includes(searchTerm)
    )
    .take(5)
    .value();

  const content = (
    <div className={styles.workbenchContent}>
      <div>
        <Subheading>To add teams to this space, search within your organization</Subheading>
        <Autocomplete
          placeholder="Search for a team"
          disabled={isLoading}
          className={styles.select}
          width="full"
          onChange={team => dispatch({ type: 'ADD_TEAM', payload: team.sys.id })}
          onQueryChange={value => dispatch({ type: 'SEARCH', payload: value })}
          items={teamsInAutocomplete}>
          {items => items.map(team => <AutocompleteTeam key={team.sys.id} team={team} />)}
        </Autocomplete>
        <HelpText className={styles.selectHelp}>
          It is possible to add multiple teams. The role assignment will apply to all teams you are
          adding.
        </HelpText>
      </div>
      {shouldShowControls && (
        <>
          <div data-test-id="teams-and-roles-lists" className={styles.teamsAndRolesLists}>
            <div className={styles.teamsContainer}>
              <SectionHeading className={cx(styles.sectionHeading, styles.teamTitle)}>
                {pluralize('team', selectedTeamIds.length, true)} selected
              </SectionHeading>
              <div className={styles.teamsList} data-test-id="teams-list">
                {selectedTeamIds.length !== 0 &&
                  selectedTeamIds.map(id => {
                    const team = teams.find(t => t.sys.id === id);

                    return (
                      <TeamInfo
                        key={team.sys.id}
                        team={team}
                        onCloseClick={() => dispatch({ type: 'REMOVE_TEAM', payload: id })}
                      />
                    );
                  })}
              </div>
            </div>
            <div className={styles.rolesContainer}>
              <SectionHeading className={styles.sectionHeading}>
                Assign role set to {pluralize('team', selectedTeamIds.length)}
              </SectionHeading>
              <RoleSelector
                roles={roles}
                selectedRoleIds={selectedRoleIds}
                onRoleSelected={(id, isSelected) =>
                  dispatch({ type: 'SELECT_ROLE', payload: { id, isSelected } })
                }
                adminSelected={adminSelected}
                onAdminSelected={isSelected =>
                  dispatch({ type: 'SELECT_ADMIN', payload: isSelected })
                }
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            className={styles.submitButton}
            disabled={submitButtonDisabled}
            loading={isLoading}
            testId="submit-button"
            onClick={() => doSubmit(state)}>
            Confirm selection and add {pluralize('team', selectedTeamIds.length)}
          </Button>
        </>
      )}
    </div>
  );

  const noTeamsAvailablePlaceholder = (
    <EmptyStateContainer>
      <EmptyStateTeams />
      <Heading>No Teams are available to be added to this space</Heading>
      <StateLink to="^.list">
        {({ onClick }) => (
          <Button buttonType="primary" onClick={onClick}>
            Back to Teams list
          </Button>
        )}
      </StateLink>
    </EmptyStateContainer>
  );

  return (
    <Workbench className={styles.workbench}>
      <Workbench.Header
        title="Add teams"
        icon={<Icon name="page-teams" scale="0.75" />}
        onBack={() =>
          go({
            path: ['spaces', 'detail', 'settings', 'teams', 'list']
          })
        }
      />
      <Workbench.Content>
        <Typography>{availableTeams.length > 0 ? content : noTeamsAvailablePlaceholder}</Typography>
      </Workbench.Content>
    </Workbench>
  );
}

AddTeamsPage.propTypes = {
  teams: PropTypes.array.isRequired,
  roles: PropTypes.array.isRequired,
  spaceId: PropTypes.string.isRequired,
  teamSpaceMemberships: PropTypes.array.isRequired
};

function TeamInfo({ team, onCloseClick }) {
  return (
    <div className={styles.teamInfo.container} data-test-id="team-in-list">
      <div className={styles.teamInfo.title}>
        <strong className={styles.teamInfo.name}>{_.truncate(team.name, { length: 25 })}</strong>{' '}
        {pluralize('member', team.memberCount, true)}
      </div>
      <div>{_.truncate(team.description, { length: 60 })}</div>
      <IconButton
        iconProps={{
          icon: 'Close'
        }}
        label="close"
        testId="team-in-list.close"
        className={cx(styles.teamInfo.close, 'team-info__close-button')}
        onClick={onCloseClick}
        buttonType="secondary"
      />
    </div>
  );
}

TeamInfo.propTypes = {
  team: PropTypes.object.isRequired,
  onCloseClick: PropTypes.func.isRequired
};

// The reason that this is separate is because the Autocomplete uses the DropdownItem internally
// which has its own padding. The styles for AutocompleteTeam and TeamInfo are the same except
// for the padding/margins on the container
function AutocompleteTeam({ team }) {
  return (
    <div data-test-id="autocomplete-team">
      <div className={styles.autocompleteTeam.title}>
        <strong className={styles.autocompleteTeam.name}>
          {_.truncate(team.name, { length: 25 })}
        </strong>{' '}
        {pluralize('member', team.memberCount, true)}
      </div>
      <div>{_.truncate(team.description, { length: 90 })}</div>
    </div>
  );
}

AutocompleteTeam.propTypes = {
  team: PropTypes.object.isRequired
};
