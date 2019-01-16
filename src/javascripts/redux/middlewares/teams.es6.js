import getOrgId from 'redux/selectors/getOrgId.es6';
import { Notification } from '@contentful/forma-36-react-components';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import { getCurrentTeam, getTeams } from '../selectors/teams.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from '../dataSets.es6';
import removeFromDataset from './utils/removeFromDataset.es6';
import { isTaken } from 'utils/ServerErrorUtils.es6';
import getOrgMemberships from 'redux/selectors/getOrgMemberships.es6';

const userToString = ({ firstName, lastName, email }) =>
  firstName ? `${firstName} ${lastName}` : email;

export default ({ dispatch, getState }) => next => async action => {
  switch (action.type) {
    case 'CREATE_NEW_TEAM': {
      next(action);
      const team = action.payload.team;
      const service = createTeamService(getOrgId(getState()));
      try {
        const newTeam = await service.create(action.payload.team);
        dispatch({ type: 'ADD_TO_DATASET', payload: { item: newTeam, dataset: TEAMS } });
        Notification.success(`Team ${newTeam.name} created successfully`);
      } catch (e) {
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
      await removeFromDataset(
        { dispatch, getState },
        next,
        action,
        createTeamService,
        (service, { sys: { id } }) => service.remove(id),
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

      const service = createTeamService(await getOrgId(getState()));
      const updatedTeam = getTeams(getState())[id];

      try {
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
      const service = createTeamService(getOrgId(state));
      const teamId = getCurrentTeam(state);
      const team = getTeams(state)[teamId];
      const { orgMembership } = action.payload;
      const user = getOrgMemberships(state)[orgMembership].sys.user;
      try {
        const newTeamMembership = await service.createTeamMembership(teamId, orgMembership);
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
        createTeamService,
        (
          service,
          {
            sys: {
              id,
              team: {
                sys: { id: teamId }
              }
            }
          }
        ) => service.removeTeamMembership(teamId, id),
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
