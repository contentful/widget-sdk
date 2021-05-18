import { createImmerReducer } from 'core/utils/createImmerReducer';
import { ConfigurationItem } from './interfaces';
import { isSameWidget } from './utils';

export interface State {
  items: ConfigurationItem[];
  availableItems: ConfigurationItem[];
  configurableWidget: any; // TODO: What type is this? A widget with settings?
}

const RESET_WIDGET_CONFIGURATION = 'RESET_WIDGET_CONFIGURATION';
export const resetWidgetConfiguration = (defaultAvailableItems: ConfigurationItem[]) => ({
  type: RESET_WIDGET_CONFIGURATION,
  payload: {
    defaultAvailableItems,
  },
});

const REMOVE_ITEM = 'widgets/REMOVE_ITEM';

export const removeItem = (item: ConfigurationItem) => ({
  type: REMOVE_ITEM,
  payload: {
    item,
  },
});

const ADD_ITEM = 'widgets/ADD_ITEM';
export const addItem = (item: ConfigurationItem) => ({
  type: ADD_ITEM,
  payload: {
    item,
  },
});

const CHANGE_ITEM_POSITION = 'widgets/CHANGE_ITEM_POSITION';

export const changeItemPosition = (sourceIndex: number, destIndex: number) => ({
  type: CHANGE_ITEM_POSITION,
  payload: {
    sourceIndex,
    destIndex,
  },
});

const OPEN_WIDGET_CONFIGURATION = 'widgets/OPEN_WIDGET_CONFIGURATION';
export const openWidgetConfiguration = (widget) => ({
  type: OPEN_WIDGET_CONFIGURATION,
  payload: {
    widget,
  },
});

const CLOSE_WIDGET_CONFIGURATION = 'widgets/CLOSE_WIDGET_CONFIGURATION';
export const closeWidgetConfiguration = () => ({
  type: CLOSE_WIDGET_CONFIGURATION,
});

const UPDATE_WIDGET_SETTINGS = 'widgets/UPDATE_WIDGET_SETTINGS';
export const updateWidgetSettings = (widget: any, settings: any) => ({
  type: UPDATE_WIDGET_SETTINGS,
  payload: {
    widget,
    settings,
  },
});

export const reducer = createImmerReducer<State, any>({
  [OPEN_WIDGET_CONFIGURATION]: (state: State, action) => {
    state.configurableWidget = action.payload.widget;
  },
  [CLOSE_WIDGET_CONFIGURATION]: (state: State) => {
    state.configurableWidget = null;
  },
  [RESET_WIDGET_CONFIGURATION]: (state: State, action) => {
    state.items = action.payload.defaultAvailableItems;
  },
  [REMOVE_ITEM]: (state: State, action) => {
    const removeIndex = state.items.findIndex((item) => isSameWidget(item, action.payload.item));
    if (removeIndex === -1) {
      return;
    }
    state.items.splice(removeIndex, 1);
  },
  [ADD_ITEM]: (state: State, action) => {
    state.items = [action.payload.item, ...state.items];
  },
  [CHANGE_ITEM_POSITION]: (state: State, action) => {
    const [removed] = state.items.splice(action.payload.sourceIndex, 1);
    state.items.splice(action.payload.destIndex, 0, removed);
  },
  [UPDATE_WIDGET_SETTINGS]: (state, action) => {
    const widget = action.payload.widget;
    const index = state.items.findIndex((item) => isSameWidget(item, widget));
    if (index > -1) {
      state.items[index].settings = action.payload.settings;
    }
  },
});
