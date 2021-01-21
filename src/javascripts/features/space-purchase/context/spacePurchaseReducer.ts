import { BillingDetails, PaymentDetails } from '../types';
import type { State, SelectedPlatform } from './types';
import type { SpaceData } from 'core/services/SpaceEnvContext/types';

export enum actions {
  SET_INITIAL_STATE = 'SET_INITIAL_STATE',
  SET_PURCHASING_APPS = 'SET_PURCHASING_APPS',
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

type SetPurchasingAppsAction = {
  type: actions.SET_PURCHASING_APPS;
  payload: boolean;
};

type SetCurrentStateAction = {
  type: actions.SET_CURRENT_SPACE;
  payload: SpaceData;
};

type SetCurrentSpaceRatePlanAction = {
  type: actions.SET_CURRENT_SPACE_RATE_PLAN;
  payload: unknown;
};

type SetSelectedPlatformAction = {
  type: actions.SET_SELECTED_PLATFORM;
  payload: SelectedPlatform;
};

type SetSelectedPlanAction = {
  type: actions.SET_SELECTED_PLAN;
  payload: unknown;
};

type SetBillingDetailsAction = {
  type: actions.SET_BILLING_DETAILS;
  payload: BillingDetails;
};

type SetPaymentDetailsAction = {
  type: actions.SET_PAYMENT_DETAILS;
  payload: PaymentDetails;
};

type SetSpaceNameAction = {
  type: actions.SET_SPACE_NAME;
  payload: string;
};

type SetSelectedTemplateAction = {
  type: actions.SET_SELECTED_TEMPLATE;
  payload: unknown;
};

export type Action =
  | SetInitialStateAction
  | SetPurchasingAppsAction
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
    case actions.SET_PURCHASING_APPS:
      return { ...state, purchasingApps: action.payload };
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
