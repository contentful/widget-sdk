import { concat, update, drop } from 'lodash/fp';

const initialState = {
  teams: []
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case 'SUBMIT_NEW_TEAM': {
      return update('teams', concat(payload.team), state);
    }
    case 'TEAM_PERSISTED': {
      return update('teams', drop(1), state);
    }
  }
  return state;
};
