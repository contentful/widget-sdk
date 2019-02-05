import { createImmerReducer, createAction, createAsyncActions } from './utils.es6';
import { SidebarType } from './constants.es6';

/* Actions */

export const selectSidebarType = createAction('sidebar/SELECT_TYPE', 'sidebarType');

export const saveConfigurationAsync = createAsyncActions('sidebar/SAVE_CONFIGURATION', {
  request: ['configuration'],
  success: ['configuration'],
  failure: ['error']
});

/* Reducer */

const initialState = {
  sidebarType: SidebarType.default
};

export default createImmerReducer(initialState, {
  [selectSidebarType.type]: (state, action) => {
    state.sidebarType = action.payload.sidebarType;
  }
});
