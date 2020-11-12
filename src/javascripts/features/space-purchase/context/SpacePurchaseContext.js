import React, { createContext, useReducer } from 'react';

import { spacePurchaseReducer } from './spacePurchaseReducer';

const initialState = {
  organization: undefined,
  currentSpace: undefined,
  currentSpaceRatePlan: undefined,
  selectedPlan: undefined,
  sessionId: undefined,
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
