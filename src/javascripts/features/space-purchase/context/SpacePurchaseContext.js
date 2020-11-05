import React, { createContext, useReducer } from 'react';

import { spacePurchaseReducer } from './spacePurchaseReducer';

const initialState = {
  selectedPlan: undefined,
  currentSpace: undefined,
  currentSpaceRatePlan: undefined,
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
