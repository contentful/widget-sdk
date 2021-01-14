import { uniqueId } from 'lodash';
import {
  SET_REFERENCES,
  SET_INITIAL_UNIQUE_REFERENCES_AMOUNT,
  SET_LINKS_COUNTER,
  SET_SELECTED_ENTITIES,
  SET_VALIDATIONS,
  SET_MAX_DEPTH_REACHED,
  SET_ACTIONS_DISABLED,
  SET_INITIAL_REFERENCES_AMOUNT,
  SET_REFERENCE_TREE_KEY,
  SET_IS_TOO_COMPLEX,
  SET_PROCESSING_ACTION,
  SET_SELECTED_ENTITIES_MAP,
  SET_IS_SLICED,
} from './actions';

export type ReferencesState = {
  references: [];
  linksCounter: object;
  selectedEntities: [];
  selectedEntitiesMap: Map<string, object>;
  validations: object | null;
  isSliced: boolean;
  isTreeMaxDepthReached: boolean;
  isActionsDisabled: boolean;
  initialReferencesAmount: number;
  initialUniqueReferencesAmount: number;
  referenceTreeKey: string;
  isTooComplex: boolean;
  processingAction: string | null;
};

export type Action = {
  type:
    | typeof SET_REFERENCES
    | typeof SET_INITIAL_UNIQUE_REFERENCES_AMOUNT
    | typeof SET_LINKS_COUNTER
    | typeof SET_SELECTED_ENTITIES
    | typeof SET_VALIDATIONS
    | typeof SET_MAX_DEPTH_REACHED
    | typeof SET_ACTIONS_DISABLED
    | typeof SET_INITIAL_REFERENCES_AMOUNT
    | typeof SET_REFERENCE_TREE_KEY
    | typeof SET_IS_TOO_COMPLEX
    | typeof SET_PROCESSING_ACTION
    | typeof SET_SELECTED_ENTITIES_MAP
    | typeof SET_IS_SLICED;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export const initialState: ReferencesState = {
  references: [],
  linksCounter: {},
  selectedEntities: [],
  selectedEntitiesMap: new Map(),
  validations: null,
  isSliced: false,
  isTreeMaxDepthReached: false,
  isActionsDisabled: false,
  initialReferencesAmount: 0,
  initialUniqueReferencesAmount: 0,
  referenceTreeKey: uniqueId('id_'),
  isTooComplex: false,
  processingAction: null,
};

export function reducer(state: ReferencesState, action: Action): ReferencesState {
  switch (action.type) {
    case SET_REFERENCES:
      return { ...state, references: action.value };
    case SET_INITIAL_UNIQUE_REFERENCES_AMOUNT:
      return { ...state, initialUniqueReferencesAmount: action.value };
    case SET_LINKS_COUNTER:
      return { ...state, linksCounter: action.value };
    case SET_SELECTED_ENTITIES:
      return { ...state, selectedEntities: action.value };
    case SET_SELECTED_ENTITIES_MAP:
      return { ...state, selectedEntitiesMap: action.value };
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
    case SET_PROCESSING_ACTION:
      return { ...state, processingAction: action.value };
    case SET_IS_SLICED:
      return { ...state, isSliced: action.value };
    default:
      return state;
  }
}
