import { createImmerReducer } from './utils.es6';
import { SidebarType } from '../constants.es6';

/* Actions */
const SELECT_SIDEBAR_TYPE = 'sidebar/SELECT_TYPE';

export const selectSidebarType = sidebarType => ({
  type: SELECT_SIDEBAR_TYPE,
  payload: {
    sidebarType
  }
});

/* Reducer */

export const initialState = {
  sidebarType: SidebarType.default
};

export default createImmerReducer(initialState, {
  [SELECT_SIDEBAR_TYPE]: (state, action) => {
    state.sidebarType = action.payload.sidebarType;
  }
});
