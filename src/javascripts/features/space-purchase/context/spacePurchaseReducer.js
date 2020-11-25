export const actions = {
  SET_INITIAL_STATE: 'SET_INITIAL_STATE',
  SET_CURRENT_SPACE: 'SET_CURRENT_SPACE',
  SET_CURRENT_SPACE_RATE_PLAN: 'SET_CURRENT_SPACE_RATE_PLAN',
  SET_SELECTED_PLAN: 'SET_SELECTED_PLAN',
  SET_BILLING_DETAILS: 'SET_BILLING_DETAILS',
  SET_BILLING_DETAILS_LOADING: 'SET_BILLING_DETAILS_LOADING',
};

export const spacePurchaseReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_INITIAL_STATE:
      return { ...state, ...action.payload };
    case actions.SET_SELECTED_PLAN:
      return { ...state, selectedPlan: action.payload };
    case actions.SET_CURRENT_SPACE:
      return { ...state, currentSpace: action.payload };
    case actions.SET_CURRENT_SPACE_RATE_PLAN:
      return { ...state, currentSpaceRatePlan: action.payload };
    case actions.SET_BILLING_DETAILS:
      return { ...state, billingDetails: action.payload };
    case actions.SET_BILLING_DETAILS_LOADING:
      return { ...state, billingDetailsLoading: action.payload };
    default:
      return state;
  }
};
