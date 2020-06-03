import { SET_RELEASES_INCLUDING_ENTRY } from './actions';

type ReferencesState = {
  releasesIncludingEntity: [];
};

type Action = {
  type: typeof SET_RELEASES_INCLUDING_ENTRY;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export const initialState: ReferencesState = {
  releasesIncludingEntity: [],
};

export function reducer(state: ReferencesState, action: Action): ReferencesState {
  switch (action.type) {
    case SET_RELEASES_INCLUDING_ENTRY:
      return { ...state, releasesIncludingEntity: action.value };
    default:
      return state;
  }
}
