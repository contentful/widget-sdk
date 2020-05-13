import React, { createContext, useReducer } from 'react';
import { initialState, reducer } from './state/reducer';

export const ReferencesContext = createContext(initialState);

export function ReferencesProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ReferencesContext.Provider value={{ state, dispatch }}>
      {props.children}
    </ReferencesContext.Provider>
  );
}
