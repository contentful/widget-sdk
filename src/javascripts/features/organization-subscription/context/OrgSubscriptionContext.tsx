import React, { createContext, useReducer } from 'react';

import type { OrgSubscriptionState } from './types';
import { orgSubscriptionReducer, Action } from './orgSubscriptionReducer';

interface OrgSubscriptionContext {
  state: OrgSubscriptionState;
  dispatch: React.Dispatch<Action>;
}

const contextInitialState: OrgSubscriptionState = {
  spacePlans: [],
};

export const OrgSubscriptionContext = createContext({
  state: contextInitialState,
} as OrgSubscriptionContext);

interface OrgSubscriptionContextProviderProps {
  initialState?: OrgSubscriptionState;
  children: React.ReactNode;
}

export function OrgSubscriptionContextProvider({
  initialState = contextInitialState,
  children,
}: OrgSubscriptionContextProviderProps) {
  const [state, dispatch] = useReducer(orgSubscriptionReducer, initialState);

  return (
    <OrgSubscriptionContext.Provider value={{ state, dispatch }}>
      {children}
    </OrgSubscriptionContext.Provider>
  );
}
