import getOrgId from 'redux/selectors/getOrgId.es6';
import { Notification } from '@contentful/forma-36-react-components';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import { getCurrentTeam } from '../selectors/teams.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from '../dataSets.es6';
import addCurrentTeamToMembership from 'redux/utils/addCurrentTeamToMembership.es6';
import getDatasets from 'redux/selectors/getDatasets.es6';
import { USERS } from 'redux/dataSets.es6';

export default ({ dispatch, getState }) => next => async action => {
  switch (action.type) {
    case 'SUBMIT_NEW_TEAM': {
      next(action);
      const service = createTeamService(await getOrgId(getState()));
      const newTeam = await service.create(action.payload.team);
      dispatch({ type: 'ADD_TO_DATASET', payload: { item: newTeam, dataset: TEAMS } });
      Notification.success(`Team ${newTeam.name} created successfully`);
      break;
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP': {
      next(action);
      const state = getState();
      const service = createTeamService(await getOrgId(state));
      const teamId = getCurrentTeam(state);
      const newTeamMembership = await service.createTeamMembership(
        teamId,
        action.payload.orgMembership
      );
      const membershipWithTeam = addCurrentTeamToMembership(state, newTeamMembership);
      dispatch({
        type: 'ADD_TO_DATASET',
        payload: { item: membershipWithTeam, dataset: TEAM_MEMBERSHIPS }
      });
      break;
    }
    case 'REMOVE_TEAM_MEMBERSHIP': {
      // get data from store before reducer runs and updates it
      const state = getState();
      const datasets = getDatasets(state);
      const service = createTeamService(await getOrgId(state));
      next(action);

      const { teamMembershipId } = action.payload;
      const membership = datasets[TEAM_MEMBERSHIPS][teamMembershipId];
      const user = datasets[USERS][membership.sys.user.sys.id];
      const teamId = getCurrentTeam(state);
      const team = datasets[TEAMS][teamId];

      try {
        await service.removeTeamMembership(teamId, teamMembershipId);
        Notification.success(
          `User ${user.firstName} ${user.lastName} successfully removed from team ${team.name}`
        );
      } catch (ex) {
        dispatch({
          type: 'ADD_TO_DATASET',
          payload: { item: membership, dataset: TEAM_MEMBERSHIPS }
        });
        Notification.error(
          `Could not remove user ${user.firstName} ${user.lastName} from team ${team.name}`
        );
      }
      break;
    }
    default:
      next(action);
  }
};
