function createReducer(handlers) {
  return (state, action) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };
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

export const reducer = createReducer({
  [OPEN_WIDGET_CONFIGURATION]: (state, action) => {
    return {
      ...state,
      configurableWidget: action.payload.widget
    };
  },
  [CLOSE_WIDGET_CONFIGURATION]: state => {
    return {
      ...state,
      configurableWidget: null
    };
  },
  [SELECT_SIDEBAR_TYPE]: (state, action) => {
    return {
      ...state,
      sidebarType: action.payload.sidebarType
    };
  },
  [REMOVE_ITEM_FROM_SIDEBAR]: (state, action) => {
    const removeIndex = state.items.findIndex(item => areWidgetsSame(item, action.payload.item));
    if (removeIndex === -1) {
      return state;
    }
    const removed = state.items[removeIndex];
    const newItems = [...state.items];
    newItems.splice(removeIndex, 1);
    const newAvailableItems = [...state.availableItems];
    if (!removed.problem) {
      newAvailableItems.push(removed);
    }
    return {
      ...state,
      items: newItems,
      availableItems: newAvailableItems
    };
  },
  [ADD_ITEM_TO_SIDEBAR]: (state, action) => {
    const index = state.availableItems.findIndex(item => areWidgetsSame(item, action.payload.item));
    if (index === -1) {
      return state;
    }
    const added = state.availableItems[index];
    const newAvailableItems = [...state.availableItems];
    newAvailableItems.splice(index, 1);
    const newItems = [...state.items, added];
    return {
      ...state,
      items: newItems,
      availableItems: newAvailableItems
    };
  },
  [CHANGE_ITEM_POSITION]: (state, action) => {
    const newItems = [...state.items];
    const [removed] = newItems.splice(action.payload.sourceIndex, 1);
    newItems.splice(action.payload.destIndex, 0, removed);
    return {
      ...state,
      items: newItems
    };
  },
  [UPDATE_WIDGET_SETTINGS]: (state, action) => {
    const widget = action.payload.widget;
    const index = state.items.findIndex(item => areWidgetsSame(item, widget));
    if (index === -1) {
      return state;
    }
    const newItems = [...state.items];
    newItems[index].settings = action.payload.settings;
    return {
      ...state,
      items: newItems
    };
  }
});
