import { createImmerReducer } from 'redux/utils/createImmerReducer';

/* Actions */
const SELECT_ACTIVE_OPTION = 'editor/SELECT_ACTIVE_OPTION';

export const selectActiveOption = option => ({
  type: SELECT_ACTIVE_OPTION,
  payload: {
    option
  }
});

const SET_WIDGET = 'editor/SET_WIDGET';

export const setWidget = widget => ({
  type: SET_WIDGET,
  payload: {
    widget
  }
});

const SET_SETTINGS = 'editor/SET_SETTINGS';

export const setSettings = settings => ({
  type: SET_SETTINGS,
  payload: {
    settings
  }
});

export const actions = {
  selectActiveOption,
  setWidget,
  setSettings
};

export const reducer = createImmerReducer({
  [SELECT_ACTIVE_OPTION]: (state, action) => {
    state.activeOption = action.payload.option;
  },
  [SET_WIDGET]: (state, action) => {
    const { widget } = action.payload;
    state.configuration = widget
      ? {
          widgetNamespace: widget.namespace,
          widgetId: widget.id,
          settings: {}
        }
      : undefined;
    state.touched = true;
  },
  [SET_SETTINGS]: (state, action) => {
    state.configuration = state.configuration || {};
    state.configuration.settings = action.payload.settings;
  }
});
