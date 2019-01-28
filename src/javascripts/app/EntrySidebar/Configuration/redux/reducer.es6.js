import { createImmerReducer, createAction } from './utils.es6';
import { SidebarType } from './constants.es6';

/* Actions */

export const selectSidebarType = createAction('sidebar/SELECT_TYPE', 'sidebarType');

/* Reducer */

const initialState = {
  sidebarType: SidebarType.default
};

export default createImmerReducer(initialState, {
  [selectSidebarType.type]: (state, action) => {
    state.sidebarType = action.payload.sidebarType;
  }
});
