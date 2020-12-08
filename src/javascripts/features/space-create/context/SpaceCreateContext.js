import React, { createContext, useReducer } from 'react';

import { spaceCreateReducer } from './spaceCreateReducer';

const initialState = {
  organization: undefined,
  spaceName: '',
  selectedTemplate: null,
  selectedPlan: undefined,
};

export const SpaceCreateState = createContext();

export function SpaceCreateContextProvider({ children }) {
  const [state, dispatch] = useReducer(spaceCreateReducer, initialState);

  return (
    <SpaceCreateState.Provider value={{ dispatch, state }}>{children}</SpaceCreateState.Provider>
  );
}
