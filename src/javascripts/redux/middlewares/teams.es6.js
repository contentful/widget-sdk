import { Notification } from '@contentful/forma-36-react-components';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import createTeamMembershipService from 'app/OrganizationSettings/Teams/TeamMemberships/TeamMembershipService.es6';
import { getCurrentTeam, getTeams } from '../selectors/teams.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from '../datasets.es6';
import removeFromDataset from './utils/removeFromDataset.es6';
import { isTaken } from 'utils/ServerErrorUtils.es6';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';

const userToString = ({ firstName, lastName, email }) =>
  firstName ? `${firstName} ${lastName}` : email;

// all middlewares have this signature (except the optional async)
// `next(action)` must always be called, as it activates other middlewares and the reducer

// that means the return value of `getState` might change after `next(action)` was called...
// ...because the state might have been updated by the reducer
export default ({ dispatch, getState }) => next => async action => {
  switch (action.type) {
    case 'CREATE_NEW_TEAM': {
      next(action);
      const team = action.payload.team;
      const service = createTeamService(getState());
      try {
        const newTeam = await service.create(action.payload.team);
        dispatch({ type: 'ADD_TO_DATASET', payload: { item: newTeam, dataset: TEAMS } });
        Notification.success(`Team ${newTeam.name} created successfully`);
      } catch (e) {
        // Action structure follows this guideline: https://github.com/redux-utilities/flux-standard-actions
        dispatch({
          type: 'SUBMIT_NEW_TEAM_FAILED',
          error: true,
          payload: e,
          meta: { team: action.payload.team }
        });
        if (isTaken(e)) {
          Notification.error(`${team.name} is already being used.`);
          return;
        }
        Notification.error(e.message);
      }
      break;
    }
    case 'REMOVE_TEAM': {
      // this is a rather aggressive way of making code DRY
      // therefore this function should not be reused outside this middleware
      await removeFromDataset(
        { dispatch, getState },
        next,
        action,
        createTeamService,
        action.payload.teamId,
        TEAMS,
        ({ name }) => `Remove team ${name}`,
        ({ name }) => `Are you sure you want to remove the team ${name}?`,
        ({ name }) => `Successfully removed team ${name}`,
        ({ name }) => `Could not remove team ${name}`
      );
      break;
    }
    case 'EDIT_TEAM_CONFIRMED': {
      const { id } = action.payload;
      const oldTeam = getTeams(getState())[id];

      next(action);
      // the reducer updated the team for us

      // it's useful for testing and tooling to move as much logic as possible to reducers
      // (or even better: selectors)
      const state = getState();
      const service = createTeamService(state);
      const updatedTeam = getTeams(state)[id];

      try {
        // no pending action needed, as the `EDIT_TEAM_CONFIRMED` can be used for pending
        const persistedTeam = await service.update(updatedTeam);
        dispatch({ type: 'ADD_TO_DATASET', payload: { dataset: TEAMS, item: persistedTeam } });
        Notification.success(`Successfully changed team ${persistedTeam.name}`);
      } catch (e) {
        dispatch({ type: 'ADD_TO_DATASET', payload: { dataset: TEAMS, item: oldTeam } });
        Notification.error(`Could not change team  ${oldTeam.name}`);
      }

      break;
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP': {
      const state = getState();
      next(action);
      const service = createTeamMembershipService(state);
      const teamId = getCurrentTeam(state);
      const team = getTeams(state)[teamId];
      const { orgMembership } = action.payload;
      const user = getOrgMemberships(state)[orgMembership].sys.user;
      try {
        const newTeamMembership = await service.create(orgMembership);
        dispatch({
          type: 'ADD_TO_DATASET',
          payload: { item: newTeamMembership, dataset: TEAM_MEMBERSHIPS }
        });
        Notification.success(`Successfully added ${userToString(user)} to team ${team.name}`);
      } catch (e) {
        dispatch({
          type: 'SUBMIT_NEW_TEAM_MEMBERSHIP_FAILED',
          error: true,
          payload: e,
          meta: { orgMembership }
        });
        Notification.error(`Could not add ${userToString(user)} to team ${team.name}`);
      }
      break;
    }
    case 'REMOVE_TEAM_MEMBERSHIP': {
      await removeFromDataset(
        { dispatch, getState },
        next,
        action,
        createTeamMembershipService,
        action.payload.teamMembershipId,
        TEAM_MEMBERSHIPS,
        ({
          sys: {
            team: { name }
          }
        }) => `Remove user from team ${name}`,
        ({ sys: { team, user } }) =>
          `Are you sure you want to remove ${userToString(user)} from team ${team.name}?`,
        ({ sys: { team, user } }) =>
          `Successfully removed ${userToString(user)} from team ${team.name}`,
        ({ sys: { team, user } }) => `Could not remove ${userToString(user)} from team ${team.name}`
      );
      break;
    }
    default:
      next(action);
  }
};
