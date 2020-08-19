import { createImmerReducer } from 'core/utils/createImmerReducer';
import { ConfigurationItem } from 'app/ContentModel/Editor/WidgetsConfiguration/interfaces';

interface State {
  items: ConfigurationItem[];
  availableItems: ConfigurationItem[];
  configurableWidget: any;
}

const RESET_WIDGET_CONFIGURATION = 'RESET_WIDGET_CONFIGURATION';
export const resetWidgetConfiguration = (defaultAvailableItems: ConfigurationItem[]) => ({
  type: RESET_WIDGET_CONFIGURATION,
  payload: {
    defaultAvailableItems,
  },
});

const REMOVE_ITEM_FROM_SIDEBAR = 'sidebar/REMOVE_ITEM_FROM_SIDEBAR';

export const removeItemFromSidebar = (item) => ({
  type: REMOVE_ITEM_FROM_SIDEBAR,
  payload: {
    item,
  },
});

const ADD_ITEM_TO_SIDEBAR = 'sidebar/ADD_ITEM_TO_SIDEBAR';
export const addItemToSidebar = (item) => ({
  type: ADD_ITEM_TO_SIDEBAR,
  payload: {
    item,
  },
});

const CHANGE_ITEM_POSITION = 'sidebar/CHANGE_ITEM_POSITION';

export const changeItemPosition = (sourceIndex, destIndex) => ({
  type: CHANGE_ITEM_POSITION,
  payload: {
    sourceIndex,
    destIndex,
  },
});

const OPEN_WIDGET_CONFIGURATION = 'sidebar/OPEN_WIDGET_CONFIGURATION';
export const openWidgetConfiguration = (widget) => ({
  type: OPEN_WIDGET_CONFIGURATION,
  payload: {
    widget,
  },
});

const CLOSE_WIDGET_CONFIGURATION = 'sidebar/CLOSE_WIDGET_CONFIGURATION';
export const closeWidgetConfiguration = () => ({
  type: CLOSE_WIDGET_CONFIGURATION,
});

const UPDATE_WIDGET_SETTINGS = 'sidebar/UPDATE_WIDGET_SETTINGS';
export const updateWidgetSettings = (widget, settings) => ({
  type: UPDATE_WIDGET_SETTINGS,
  payload: {
    widget,
    settings,
  },
});

const areWidgetsSame = (widget1, widget2) =>
  widget1.widgetId === widget2.widgetId && widget1.widgetNamespace === widget2.widgetNamespace;

export const reducer = createImmerReducer({
  [OPEN_WIDGET_CONFIGURATION]: (state: State, action) => {
    state.configurableWidget = action.payload.widget;
  },
  [CLOSE_WIDGET_CONFIGURATION]: (state: State) => {
    state.configurableWidget = null;
  },
  [RESET_WIDGET_CONFIGURATION]: (state: State, action) => {
    state.items = action.payload.defaultAvailableItems;
  },
  [REMOVE_ITEM_FROM_SIDEBAR]: (state: State, action) => {
    const removeIndex = state.items.findIndex((item) => areWidgetsSame(item, action.payload.item));
    if (removeIndex === -1) {
      return;
    }
    state.items.splice(removeIndex, 1);
  },
  [ADD_ITEM_TO_SIDEBAR]: (state: State, action) => {
    const index = state.availableItems.findIndex((item) =>
      areWidgetsSame(item, action.payload.item)
    );
    if (index === -1) {
      return;
    }
    const added = state.availableItems[index];
    state.items = [added, ...state.items];
  },
  [CHANGE_ITEM_POSITION]: (state: State, action) => {
    const [removed] = state.items.splice(action.payload.sourceIndex, 1);
    state.items.splice(action.payload.destIndex, 0, removed);
  },
  [UPDATE_WIDGET_SETTINGS]: (state, action) => {
    const widget = action.payload.widget;
    const index = state.items.findIndex((item) => areWidgetsSame(item, widget));
    if (index > -1) {
      state.items[index].settings = action.payload.settings;
    }
  },
});
