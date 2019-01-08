import { concat, update, drop } from 'lodash/fp';
import { TEAMS } from '../dataSets.es6';

export default (state = {}, { type, payload }) => {
  switch (type) {
    case 'CREATE_NEW_TEAM': {
      return update(TEAMS, teams => concat(payload.team, teams || []), state);
    }
    case 'SUBMIT_NEW_TEAM_FAILED':
    case 'ADD_TO_DATASET': {
      return update(payload.dataset, drop(1), state);
    }
  }
  return state;
};
