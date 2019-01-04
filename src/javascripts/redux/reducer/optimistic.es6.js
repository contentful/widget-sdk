import { concat, update, drop } from 'lodash/fp';

export default (state = {}, { type, payload }) => {
  switch (type) {
    case 'SUBMIT_NEW_TEAM': {
      return update('teams', teams => concat(payload.team, teams || []), state);
    }
    case 'ADD_TO_DATASET': {
      return update(payload.dataset, drop(1), state);
    }
  }
  return state;
};
