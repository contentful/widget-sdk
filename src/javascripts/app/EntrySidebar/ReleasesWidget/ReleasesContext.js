import React, { createContext, useReducer } from 'react';
import { initialState, reducer } from './state/reducer';

export const ReleasesContext = createContext(initialState);

export function ReleasesProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ReleasesContext.Provider value={{ state, dispatch }}>
      {props.children}
    </ReleasesContext.Provider>
  );
}
