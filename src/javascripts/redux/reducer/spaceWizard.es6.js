import { combineReducers } from 'redux';

import * as actions from '../actions/spaceWizard/actions.es6';

export default combineReducers({
  partnershipMeta,
  spaceCreation,
  spaceChange,
  subscriptionPrice,
  currentStep,
  newSpaceMeta,
  spacePlans,
  templates,
  spacePlanSelected
});

function partnershipMeta(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.SPACE_PARTNERSHIP:
      return {
        ...state,
        isPartnerSpacePlan: action.isPartnerSpacePlan
      };
    case actions.SPACE_PARTNERSHIP_FIELDS:
      return {
        ...state,
        fields: action.fields
      };
    default:
      return state;
  }
}

function spaceCreation(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.SPACE_CREATION_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };
    case actions.SPACE_CREATION_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case actions.SPACE_CREATION_SUCCESS:
      return {
        ...state,
        success: true
      };
    default:
      return state;
  }
}

function spaceChange(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.SPACE_CHANGE_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };
    case actions.SPACE_CHANGE_FAILURE:
      return {
        ...state,
        error: action.error
      };
    default:
      return state;
  }
}

function subscriptionPrice(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.SUBSCRIPTION_PRICE_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };
    case actions.SUBSCRIPTION_PRICE_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case actions.SUBSCRIPTION_PRICE_SUCCESS:
      return {
        ...state,
        totalPrice: action.totalPrice
      };
    default:
      return state;
  }
}

function currentStep(state = '', action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return '';
    case actions.SPACE_WIZARD_NAVIGATE:
      return action.stepId;
    default:
      return state;
  }
}

function newSpaceMeta(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.NEW_SPACE_NAME:
      return {
        ...state,
        name: action.name
      };
    case actions.NEW_SPACE_TEMPLATE:
      return {
        ...state,
        template: action.template
      };
    default:
      return state;
  }
}

function spacePlans(
  state = {
    spaceRatePlans: [],
    freeSpacesResource: {}
  },
  action
) {
  const { spaceRatePlans, freeSpacesResource } = action;

  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {
        spaceRatePlans: [],
        freeSpacesResource: {}
      };
    case actions.SPACE_PLANS_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };
    case actions.SPACE_PLANS_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case actions.SPACE_PLANS_SUCCESS:
      return {
        ...state,
        spaceRatePlans,
        freeSpacesResource
      };
    default:
      return state;
  }
}

function templates(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.SPACE_TEMPLATES_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };

    case actions.SPACE_TEMPLATES_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case actions.SPACE_TEMPLATES_SUCCESS:
      return {
        ...state,
        templatesList: action.templatesList
      };
    default:
      return state;
  }
}

function spacePlanSelected(state = {}, action) {
  switch (action.type) {
    case actions.SPACE_WIZARD_RESET:
      return {};
    case actions.SPACE_PLAN_SELECTED:
      return {
        currentPlan: action.currentPlan,
        selectedPlan: action.selectedPlan
      };
    default:
      return state;
  }
}
