import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';

/* Actions */
const SELECT_ACTIVE_OPTION = 'editor/SELECT_ACTIVE_OPTION';

export const selectActiveOption = option => ({
  type: SELECT_ACTIVE_OPTION,
  payload: {
    option
  }
});

const SET_EXTENSION_ID = 'editor/SET_EXTENSION_ID';

export const setExtensionId = id => ({
  type: SET_EXTENSION_ID,
  payload: {
    id
  }
});

const SET_EXTENSION_SETTINGS = 'editor/SET_EXTENSION_SETTINGS';

export const setExtensionSettings = settings => ({
  type: SET_EXTENSION_SETTINGS,
  payload: {
    settings
  }
});

export const actions = {
  setExtensionId,
  selectActiveOption,
  setExtensionSettings
};

export const reducer = createImmerReducer({
  [SELECT_ACTIVE_OPTION]: (state, action) => {
    state.activeOption = action.payload.option;
  },
  [SET_EXTENSION_ID]: (state, action) => {
    state.extensionId = action.payload.id;
    state.extensionSettings = {};
    state.touched = true;
  },
  [SET_EXTENSION_SETTINGS]: (state, action) => {
    state.extensionSettings = action.payload.settings;
  }
});
