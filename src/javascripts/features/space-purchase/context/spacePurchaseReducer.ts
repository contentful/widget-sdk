import type { State } from './types';

export enum actions {
  SET_INITIAL_STATE = 'SET_INITIAL_STATE',
  SET_CURRENT_SPACE = 'SET_CURRENT_SPACE',
  SET_CURRENT_SPACE_RATE_PLAN = 'SET_CURRENT_SPACE_RATE_PLAN',
  SET_SELECTED_PLAN = 'SET_SELECTED_PLAN',
  SET_SELECTED_PLATFORM = 'SET_SELECTED_PLATFORM',
  SET_BILLING_DETAILS = 'SET_BILLING_DETAILS',
  SET_PAYMENT_DETAILS = 'SET_PAYMENT_DETAILS',
  SET_SPACE_NAME = 'SET_SPACE_NAME',
  SET_SELECTED_TEMPLATE = 'SET_SELECTED_TEMPLATE',
}

type SetInitialStateAction = {
  type: actions.SET_INITIAL_STATE;
  payload: State;
};

type SetCurrentStateAction = {
  type: actions.SET_CURRENT_SPACE;
  payload: State['currentSpace'];
};

type SetCurrentSpaceRatePlanAction = {
  type: actions.SET_CURRENT_SPACE_RATE_PLAN;
  payload: State['currentSpaceRatePlan'];
};

type SetSelectedPlatformAction = {
  type: actions.SET_SELECTED_PLATFORM;
  payload: State['selectedPlatform'];
};

type SetSelectedPlanAction = {
  type: actions.SET_SELECTED_PLAN;
  payload: State['selectedPlan'];
};

type SetBillingDetailsAction = {
  type: actions.SET_BILLING_DETAILS;
  payload: State['billingDetails'];
};

type SetPaymentDetailsAction = {
  type: actions.SET_PAYMENT_DETAILS;
  payload: State['paymentDetails'];
};

type SetSpaceNameAction = {
  type: actions.SET_SPACE_NAME;
  payload: State['spaceName'];
};

type SetSelectedTemplateAction = {
  type: actions.SET_SELECTED_TEMPLATE;
  payload: State['selectedTemplate'];
};

export type Action =
  | SetInitialStateAction
  | SetCurrentStateAction
  | SetCurrentSpaceRatePlanAction
  | SetSelectedPlatformAction
  | SetSelectedPlanAction
  | SetBillingDetailsAction
  | SetPaymentDetailsAction
  | SetSpaceNameAction
  | SetSelectedTemplateAction;

export const spacePurchaseReducer = (state: State, action: Action) => {
  switch (action.type) {
    case actions.SET_INITIAL_STATE:
      return { ...state, ...action.payload };
    case actions.SET_SELECTED_PLATFORM:
      return { ...state, selectedPlatform: action.payload };
    case actions.SET_SELECTED_PLAN:
      return { ...state, selectedPlan: action.payload };
    case actions.SET_CURRENT_SPACE:
      return { ...state, currentSpace: action.payload };
    case actions.SET_CURRENT_SPACE_RATE_PLAN:
      return { ...state, currentSpaceRatePlan: action.payload };
    case actions.SET_BILLING_DETAILS:
      return { ...state, billingDetails: action.payload };
    case actions.SET_PAYMENT_DETAILS:
      return { ...state, paymentDetails: action.payload };
    case actions.SET_SPACE_NAME:
      return { ...state, spaceName: action.payload };
    case actions.SET_SELECTED_TEMPLATE:
      return { ...state, selectedTemplate: action.payload };
    default:
      return state;
  }
};
