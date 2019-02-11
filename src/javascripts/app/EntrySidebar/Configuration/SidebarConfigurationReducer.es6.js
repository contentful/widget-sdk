import produce from 'immer';

function createImmerReducer(handlers) {
  return (state, action) =>
    produce(state, draft => {
      if (handlers.hasOwnProperty(action.type)) {
        return handlers[action.type](draft, action);
      }
    });
}

/* Actions */
const SELECT_SIDEBAR_TYPE = 'sidebar/SELECT_SIDEBAR_TYPE';

export const selectSidebarType = sidebarType => ({
  type: SELECT_SIDEBAR_TYPE,
  payload: {
    sidebarType
  }
});

const REMOVE_ITEM_FROM_SIDEBAR = 'sidebar/REMOVE_ITEM_FROM_SIDEBAR';

export const removeItemFromSidebar = item => ({
  type: REMOVE_ITEM_FROM_SIDEBAR,
  payload: {
    item
  }
});

const ADD_ITEM_TO_SIDEBAR = 'sidebar/ADD_ITEM_TO_SIDEBAR';
export const addItemToSidebar = item => ({
  type: ADD_ITEM_TO_SIDEBAR,
  payload: {
    item
  }
});

const CHANGE_ITEM_POSITION = 'sidebar/CHANGE_ITEM_POSITION';

export const changeItemPosition = (sourceIndex, destIndex) => ({
  type: CHANGE_ITEM_POSITION,
  payload: {
    sourceIndex,
    destIndex
  }
});

const OPEN_WIDGET_CONFIGURATION = 'sidebar/OPEN_WIDGET_CONFIGURATION';
export const openWidgetConfiguration = widget => ({
  type: OPEN_WIDGET_CONFIGURATION,
  payload: {
    widget
  }
});

const CLOSE_WIDGET_CONFIGURATION = 'sidebar/CLOSE_WIDGET_CONFIGURATION';
export const closeWidgetConfiguration = () => ({
  type: CLOSE_WIDGET_CONFIGURATION
});

const UPDATE_WIDGET_SETTINGS = 'sidebar/UPDATE_WIDGET_SETTINGS';
export const updateWidgetSettings = (widget, settings) => ({
  type: UPDATE_WIDGET_SETTINGS,
  payload: {
    widget,
    settings
  }
});

const areWidgetsSame = (widget1, widget2) =>
  widget1.widgetId === widget2.widgetId && widget1.widgetNamespace === widget2.widgetNamespace;

export const reducer = createImmerReducer({
  [OPEN_WIDGET_CONFIGURATION]: (state, action) => {
    state.configurableWidget = action.payload.widget;
  },
  [CLOSE_WIDGET_CONFIGURATION]: state => {
    state.configurableWidget = null;
  },
  [SELECT_SIDEBAR_TYPE]: (state, action) => {
    state.sidebarType = action.payload.sidebarType;
  },
  [REMOVE_ITEM_FROM_SIDEBAR]: (state, action) => {
    const removed = action.payload.item;
    const removeIndex = state.items.findIndex(item => areWidgetsSame(item, removed));
    state.items.splice(removeIndex, 1);
    if (!removed.invalid) {
      state.availableItems.push(removed);
    }
  },
  [CHANGE_ITEM_POSITION]: (state, action) => {
    const [removed] = state.items.splice(action.payload.sourceIndex, 1);
    state.items.splice(action.payload.destIndex, 0, removed);
  },
  [ADD_ITEM_TO_SIDEBAR]: (state, action) => {
    const added = action.payload.item;
    const removeIndex = state.availableItems.findIndex(item => areWidgetsSame(item, added));
    state.availableItems.splice(removeIndex, 1);
    state.items = [...state.items, added];
  },
  [UPDATE_WIDGET_SETTINGS]: (state, action) => {
    const widget = action.payload.widget;
    const index = state.items.findIndex(item => areWidgetsSame(item, widget));
    if (index > -1) {
      state.items[index].settings = action.payload.settings;
    }
  }
});
