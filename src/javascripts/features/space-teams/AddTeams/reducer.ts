import _ from 'lodash';
import { createImmerReducer } from 'core/utils/createImmerReducer';

type State = {
  adminSelected: boolean;
  selectedTeamIds: string[];
  selectedRoleIds: string[];
  shouldShowControls: boolean;
  isLoading: boolean;
  searchTerm: string;
};

const initialState = {
  adminSelected: true,
  selectedTeamIds: [],
  selectedRoleIds: [],
  shouldShowControls: false,
  isLoading: false,
  searchTerm: '',
};

const closeTabWarning = (evt) => {
  evt.preventDefault();
  evt.returnValue = '';
};

type ReducerActionPayload = {
  type: 'SELECT_ADMIN' | 'ADD_TEAM' | 'REMOVE_TEAM' | 'SELECT_ROLE' | 'SUBMIT' | 'SEARCH';
  payload?: any;
};

const reducer = createImmerReducer<State, ReducerActionPayload>({
  SELECT_ADMIN: (state, action) => {
    if (action.payload === true) {
      state.selectedRoleIds = [];
    }

    state.adminSelected = action.payload;
  },
  ADD_TEAM: (state, action) => {
    state.selectedTeamIds.push(action.payload);

    state.shouldShowControls = true;
    state.searchTerm = '';

    if (state.selectedTeamIds.length === 1) {
      window.addEventListener('beforeunload', closeTabWarning);
    }
  },
  REMOVE_TEAM: (state, action) => {
    state.selectedTeamIds = _.pull(state.selectedTeamIds, action.payload);

    if (state.selectedTeamIds.length === 0) {
      window.removeEventListener('beforeunload', closeTabWarning);
    }
  },
  SELECT_ROLE: (state, action) => {
    if (action.payload.isSelected) {
      state.selectedRoleIds.push(action.payload.id);
    } else {
      state.selectedRoleIds = _.pull(state.selectedRoleIds, action.payload.id);
    }
  },
  SUBMIT: (state, action) => {
    state.isLoading = action.payload;
  },
  SEARCH: (state, action) => {
    state.searchTerm = action.payload.toLowerCase();
  },
});

export { reducer, initialState, closeTabWarning };
