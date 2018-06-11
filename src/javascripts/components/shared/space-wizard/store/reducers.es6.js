export function spaceCreation (state = {}, action) {
  if (action.type === 'SPACE_CREATION_PENDING') {
    return {
      ...state,
      isLoading: action.pending
    };
  } else if (action.type === 'SPACE_CREATION_ERROR') {
    return {
      ...state,
      error: action.error
    };
  } else if (action.type === 'SPACE_CREATION_SUCCESS') {
    return {
      ...state,
      success: true
    };
  } else {
    return state;
  }
}

export function spaceChange (state = {}, action) {
  if (action.type === 'SPACE_CHANGE_PENDING') {
    return {
      ...state,
      isLoading: action.pending
    };
  } else if (action.type === 'SPACE_CHANGE_ERROR') {
    return {
      ...state,
      error: action.error
    };
  } else {
    return state;
  }
}

export function subscriptionPrice (state = {}, action) {
  if (action.type === 'SUBSCRIPTION_PRICE_LOADING') {
    return {
      ...state,
      isLoading: action.isLoading
    };
  } else if (action.type === 'SUBSCRIPTION_PRICE_SUCCESS') {
    return {
      ...state,
      totalPrice: action.totalPrice
    };
  } else if (action.type === 'SUBSCRIPTION_PRICE_ERROR') {
    return {
      ...state,
      error: action.error
    };
  } else {
    return state;
  }
}

export function currentStep (state = '', action) {
  if (action.type === 'SPACE_WIZARD_NAVIGATE') {
    return action.id;
  } else {
    return state;
  }
}

export function newSpaceMeta (state = {}, action) {
  if (action.type === 'NEW_SPACE_NAME') {
    return {
      ...state,
      name: action.name
    };
  } else if (action.type === 'NEW_SPACE_TEMPLATE') {
    return {
      ...state,
      template: action.template
    };
  } else {
    return state;
  }
}

export function spacePlans (state = {
  spaceRatePlans: [],
  freeSpacesResource: {}
}, action) {
  if (action.type === 'SPACE_PLANS_LOADING') {
    return {
      ...state,
      isLoading: action.isLoading
    };
  } else if (action.type === 'SPACE_PLANS_LOADED') {
    const { spaceRatePlans, freeSpacesResource } = action;

    return {
      ...state,
      spaceRatePlans,
      freeSpacesResource
    };
  } else if (action.type === 'SPACE_PLANS_ERRORED') {
    return {
      ...state,
      error: action.error
    };
  } else {
    return state;
  }
}

export function spacePlanSelected (state = {}, action) {
  if (action.type === 'SPACE_PLAN_SELECTED') {
    return {
      selected: action.selected,
      current: action.current
    };
  } else {
    return state;
  }
}
