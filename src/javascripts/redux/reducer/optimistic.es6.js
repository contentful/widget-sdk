import { concat, update } from 'lodash/fp';

const initialState = {
  teams: []
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case 'SUBMIT_NEW_TEAM': {
      return update('teams', concat(payload.team), state);
    }
  }
  return state;
};
