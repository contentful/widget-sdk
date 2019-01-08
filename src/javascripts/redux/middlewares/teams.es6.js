import React from 'react';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { Notification, Modal } from '@contentful/forma-36-react-components';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import { getCurrentTeam, getTeams } from '../selectors/teams.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from '../dataSets.es6';
import addCurrentTeamToMembership from 'redux/utils/addCurrentTeamToMembership.es6';
import removeFromDataset from './utils/removeFromDataset.es6';
import getDatasets from 'redux/selectors/getDatasets.es6';
import TeamForm from 'app/OrganizationSettings/Teams/TeamForm.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

export default ({ dispatch, getState }) => next => async action => {
  switch (action.type) {
    case 'CREATE_NEW_TEAM': {
      next(action);
      const service = createTeamService(getOrgId(getState()));
      try {
        const newTeam = await service.create(action.payload.team);
        dispatch({ type: 'ADD_TO_DATASET', payload: { item: newTeam, dataset: TEAMS } });
        Notification.success(`Team ${newTeam.name} created successfully`);
      } catch (ex) {
        dispatch({
          type: 'SUBMIT_NEW_TEAM_FAILED',
          error: true,
          payload: ex,
          meta: { team: action.payload.team }
        });
        Notification.error(`Team ${action.payload.team.name} could not be created`);
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
        ({ name }) => `Team ${name} removed successfully`,
        ({ name }) => `Could not remove ${name}. Please try again`
      );
      break;
    }
    case 'EDIT_TEAM': {
      const { teamId } = action.payload;
      const state = getState();
      const datasets = getDatasets(state);
      const team = datasets[TEAMS][teamId];
      next(action);

      ModalLauncher.open(({ onClose, isShown }) => (
        <Modal isShown={isShown} onClose={onClose}>
          {() => (
            <TeamForm
              onClose={onClose}
              initialTeam={team}
              onEditConfirm={(id, changeSet) =>
                dispatch({ type: 'EDIT_TEAM_CONFIRMED', payload: { id, changeSet } })
              }
            />
          )}
        </Modal>
      ));

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
        Notification.success(`Team ${persistedTeam.name} successfully changed`);
      } catch (e) {
        dispatch({ type: 'ADD_TO_DATASET', payload: { dataset: TEAMS, item: oldTeam } });
        Notification.error('Something went wrong. Please try again');
      }

      break;
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP': {
      const state = getState();
      next(action);
      const service = createTeamService(getOrgId(state));
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
          `Are you sure you want to remove ${
            user.firstName ? `${user.firstName} ${user.lastName}` : user.email
          } from team ${team.name}?`,
        ({ name }) => `Team ${name} removed successfully`,
        ({ name }) => `Could not remove ${name}. Please try again`
      );
      break;
    }
    default:
      next(action);
  }
};
