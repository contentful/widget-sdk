import React, { createContext, useReducer } from 'react';
import PropTypes from 'prop-types';

import { spacePurchaseReducer } from './spacePurchaseReducer';

const initialState = {
  organization: undefined,
  currentSpace: undefined,
  currentSpaceRatePlan: undefined,
  spaceRatePlans: [],
  subscriptionPlans: undefined,
  selectedPlan: undefined,
  selectedPlatform: undefined,
  sessionId: undefined,
  billingDetails: undefined,
  paymentDetails: undefined,
  spaceName: 'New space',
  selectedTemplate: null,
  purchasingApps: undefined,
};

export const SpacePurchaseState = createContext();

export function SpacePurchaseContextProvider({ children }) {
  const [state, dispatch] = useReducer(spacePurchaseReducer, initialState);

  return (
    <SpacePurchaseState.Provider value={{ dispatch, state }}>
      {children}
    </SpacePurchaseState.Provider>
  );
}

// eslint-disable-next-line rulesdir/restrict-multiple-react-component-exports
export function SpacePurchaseTestContextProvider({ children, additionalInitialState = {} }) {
  const [state, dispatch] = useReducer(spacePurchaseReducer, {
    ...initialState,
    ...additionalInitialState,
  });

  return (
    <SpacePurchaseState.Provider value={{ dispatch, state }}>
      {children}
    </SpacePurchaseState.Provider>
  );
}

SpacePurchaseTestContextProvider.propTypes = {
  additionalInitialState: PropTypes.object,
};
