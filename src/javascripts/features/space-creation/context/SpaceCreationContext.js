import React, { createContext, useReducer } from 'react';

import { spaceCreationReducer } from './spaceCreationReducer';

const initialState = {
  organization: undefined,
  spaceName: '',
  selectedTemplate: null,
  selectedPlan: undefined,
};

export const SpaceCreationState = createContext();

export function SpaceCreationContextProvider({ children }) {
  const [state, dispatch] = useReducer(spaceCreationReducer, initialState);

  return (
    <SpaceCreationState.Provider value={{ dispatch, state }}>
      {children}
    </SpaceCreationState.Provider>
  );
}
