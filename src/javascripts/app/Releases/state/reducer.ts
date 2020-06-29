import {
  SET_RELEASES_INCLUDING_ENTRY,
  SET_RELEASE_ENTITIES,
  SET_RELEASE_VALIDATIONS,
  SET_RELEASE_ENTITIES_LOADING,
  SET_RELEASE_LIST_SELECTED_TAB,
  SET_RELEASE_PROCESSING_ACTION,
} from './actions';

type ReferencesState = {
  releasesIncludingEntity: [];
  entities: object;
  validations: [];
  loading: boolean;
  selectedTab: string;
  processingAction: string | null;
};

type Action = {
  type:
    | typeof SET_RELEASES_INCLUDING_ENTRY
    | typeof SET_RELEASE_ENTITIES
    | typeof SET_RELEASE_VALIDATIONS
    | typeof SET_RELEASE_ENTITIES_LOADING
    | typeof SET_RELEASE_LIST_SELECTED_TAB
    | typeof SET_RELEASE_PROCESSING_ACTION;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export const initialState: ReferencesState = {
  releasesIncludingEntity: [],
  entities: {
    entries: [],
    assets: [],
  },
  validations: [],
  loading: true,
  selectedTab: 'entries',
  processingAction: null,
};

export function reducer(state: ReferencesState, action: Action): ReferencesState {
  switch (action.type) {
    case SET_RELEASES_INCLUDING_ENTRY:
      return { ...state, releasesIncludingEntity: action.value };
    case SET_RELEASE_ENTITIES:
      return { ...state, entities: action.value };
    case SET_RELEASE_VALIDATIONS:
      return { ...state, validations: action.value };
    case SET_RELEASE_ENTITIES_LOADING:
      return { ...state, loading: action.value };
    case SET_RELEASE_LIST_SELECTED_TAB:
      return { ...state, selectedTab: action.value };
    case SET_RELEASE_PROCESSING_ACTION:
      return { ...state, processingAction: action.value };
    default:
      return state;
  }
}
