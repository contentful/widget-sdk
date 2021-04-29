import type { SpacePlan } from '../types';
import type { OrgSubscriptionState } from './types';

export enum actions {
  SET_SPACE_PLANS = 'SET_SPACE_PLANS',
  DELETE_SPACE = 'DELETE_SPACE',
}

type SetSpacePlansAction = {
  type: actions.SET_SPACE_PLANS;
  payload: OrgSubscriptionState['spacePlans'];
};

type DeleteSpaceAction = {
  type: actions.DELETE_SPACE;
  payload: SpacePlan['sys']['id'];
};

export type Action = SetSpacePlansAction | DeleteSpaceAction;

export const orgSubscriptionReducer = (state: OrgSubscriptionState, action: Action) => {
  switch (action.type) {
    case actions.SET_SPACE_PLANS:
      return { ...state, spacePlans: action.payload };
    case actions.DELETE_SPACE: {
      const newSpacePlans = state.spacePlans.filter((spacePlan) => {
        return spacePlan.space?.sys.id !== action.payload;
      });

      return { ...state, spacePlans: newSpacePlans };
    }
    default:
      return state;
  }
};
