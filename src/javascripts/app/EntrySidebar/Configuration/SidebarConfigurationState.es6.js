import produce from 'immer';
import { SidebarType, WidgetTypes } from './constants.es6';
import { EntryConfiguration } from './defaults.es6';

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

export const removeItemFromSidebar = id => ({
  type: REMOVE_ITEM_FROM_SIDEBAR,
  payload: {
    id
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

/* Reducer */

export const initialState = {
  sidebarType: SidebarType.default,
  items: EntryConfiguration,
  availableItems: [
    { id: 'custom-extension', title: 'Your custom extension', type: WidgetTypes.extension },
    { id: 'netlify-extension', title: 'Netlify Extension', type: WidgetTypes.extension }
  ]
};

export const reducer = createImmerReducer({
  [SELECT_SIDEBAR_TYPE]: (state, action) => {
    state.sidebarType = action.payload.sidebarType;
  },
  [REMOVE_ITEM_FROM_SIDEBAR]: (state, action) => {
    const item = state.items.find(item => item.id === action.payload.id);
    state.items = state.items.filter(item => item.id !== action.payload.id);
    state.availableItems.push(item);
  },
  [CHANGE_ITEM_POSITION]: (state, action) => {
    const [removed] = state.items.splice(action.payload.sourceIndex, 1);
    state.items.splice(action.payload.destIndex, 0, removed);
  },
  [ADD_ITEM_TO_SIDEBAR]: (state, action) => {
    const itemToAdd = action.payload.item;
    state.availableItems = state.availableItems.filter(item => item.id !== itemToAdd.id);
    state.items = [itemToAdd, ...state.items];
  }
});
