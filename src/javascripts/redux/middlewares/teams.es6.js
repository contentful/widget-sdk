import getOrgId from 'redux/selectors/getOrgId.es6';
import { Notification } from '@contentful/forma-36-react-components';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';

export default ({ dispatch, getState }) => next => async action => {
  next(action);
  switch (action.type) {
    case 'SUBMIT_NEW_TEAM': {
      const service = createTeamService(await getOrgId(getState()));
      const newTeam = await service.create(action.payload.team);
      dispatch({ type: 'TEAM_PERSISTED', meta: { dataset: 'teams' }, payload: { newTeam } });
      Notification.success(`Team ${newTeam.name} created successfully`);
      break;
    }
  }
};
