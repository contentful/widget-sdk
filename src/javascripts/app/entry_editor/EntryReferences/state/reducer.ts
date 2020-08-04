import { uniqueId } from 'lodash';
import {
  SET_REFERENCES,
  SET_LINKS_COUNTER,
  SET_SELECTED_ENTITIES,
  SET_VALIDATIONS,
  SET_MAX_DEPTH_REACHED,
  SET_ACTIONS_DISABLED,
  SET_INITIAL_REFERENCES_AMOUNT,
  SET_REFERENCE_TREE_KEY,
  SET_IS_TOO_COMPLEX,
} from './actions';

type ReferencesState = {
  references: [];
  linksCounter: object;
  selectedEntities: [];
  validations: object | null;
  isTreeMaxDepthReached: boolean;
  isActionsDisabled: boolean;
  initialReferencesAmount: number;
  referenceTreeKey: string;
  isTooComplex: boolean;
};

type Action = {
  type:
    | typeof SET_REFERENCES
    | typeof SET_LINKS_COUNTER
    | typeof SET_SELECTED_ENTITIES
    | typeof SET_VALIDATIONS
    | typeof SET_MAX_DEPTH_REACHED
    | typeof SET_ACTIONS_DISABLED
    | typeof SET_INITIAL_REFERENCES_AMOUNT
    | typeof SET_REFERENCE_TREE_KEY
    | typeof SET_IS_TOO_COMPLEX;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export const initialState: ReferencesState = {
  references: [],
  linksCounter: {},
  selectedEntities: [],
  validations: null,
  isTreeMaxDepthReached: false,
  isActionsDisabled: false,
  initialReferencesAmount: 0,
  referenceTreeKey: uniqueId('id_'),
  isTooComplex: false,
};

export function reducer(state: ReferencesState, action: Action): ReferencesState {
  switch (action.type) {
    case SET_REFERENCES:
      return { ...state, references: action.value };
    case SET_LINKS_COUNTER:
      return { ...state, linksCounter: action.value };
    case SET_SELECTED_ENTITIES:
      return { ...state, selectedEntities: action.value };
    case SET_VALIDATIONS:
      return { ...state, validations: action.value };
    case SET_MAX_DEPTH_REACHED:
      return { ...state, isTreeMaxDepthReached: action.value };
    case SET_ACTIONS_DISABLED:
      return { ...state, isActionsDisabled: action.value };
    case SET_INITIAL_REFERENCES_AMOUNT:
      return { ...state, initialReferencesAmount: action.value };
    case SET_REFERENCE_TREE_KEY:
      return { ...state, referenceTreeKey: action.value };
    case SET_IS_TOO_COMPLEX:
      return { ...state, isTooComplex: action.value };
    default:
      return state;
  }
}
