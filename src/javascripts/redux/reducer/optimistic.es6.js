import { concat, update, drop } from 'lodash/fp';
import { TEAMS, TEAM_MEMBERSHIPS } from '../dataSets.es6';

export default (state = {}, { type, payload }) => {
  switch (type) {
    case 'CREATE_NEW_TEAM': {
      return update(
        TEAMS,
        teams => concat({ ...payload.team, sys: { id: 'placeholder' } }, teams || []),
        state
      );
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP': {
      return update(
        TEAM_MEMBERSHIPS,
        memberships =>
          concat(
            { ...payload.orgMembership, admin: false, sys: { id: 'placeholder' } },
            memberships || []
          ),
        state
      );
    }
    case 'SUBMIT_NEW_TEAM_FAILED': {
      return update(TEAMS, drop(1), state);
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP_FAILED': {
      return update(TEAM_MEMBERSHIPS, drop(1), state);
    }
    case 'ADD_TO_DATASET': {
      return update(payload.dataset, drop(1), state);
    }
  }
  return state;
};
