import getOrgId from 'redux/selectors/getOrgId.es6';
import { Notification } from '@contentful/forma-36-react-components';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import { getCurrentTeam } from '../selectors/teams.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from '../dataSets.es6';
import addCurrentTeamToMembership from 'redux/utils/addCurrentTeamToMembership.es6'

export default ({ dispatch, getState }) => next => async action => {
  next(action);
  switch (action.type) {
    case 'SUBMIT_NEW_TEAM': {
      const service = createTeamService(await getOrgId(getState()));
      const newTeam = await service.create(action.payload.team);
      dispatch({ type: 'ADD_TO_DATASET', payload: { item: newTeam, dataset: TEAMS } });
      Notification.success(`Team ${newTeam.name} created successfully`);
      break;
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP': {
      const state = getState();
      const service = createTeamService(await getOrgId(state));
      const teamId = getCurrentTeam(state);
      const newTeamMembership = await service.createTeamMembership(
        teamId,
        action.payload.orgMembership
      );
      const membershipWithTeam = addCurrentTeamToMembership(state, newTeamMembership);
      dispatch({ type: 'ADD_TO_DATASET', payload: { item: membershipWithTeam, dataset: TEAM_MEMBERSHIPS } });
    }
  }
};
