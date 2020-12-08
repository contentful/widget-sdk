export const actions = {
  SET_INITIAL_STATE: 'SET_INITIAL_STATE',
  SET_SPACE_NAME: 'SET_SPACE_NAME',
  SET_SELECTED_TEMPLATE: 'SET_SELECTED_TEMPLATE',
  SET_SELECTED_PLAN: 'SET_SELECTED_PLAN',
};

export const spaceCreateReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_INITIAL_STATE:
      return { ...state, ...action.payload };
    case actions.SET_SPACE_NAME:
      return { ...state, spaceName: action.payload };
    case actions.SET_SELECTED_TEMPLATE:
      return { ...state, selectedTemplate: action.payload };
    case actions.SET_SELECTED_PLAN:
      return { ...state, selectedPlan: action.payload };
    default:
      return state;
  }
};
