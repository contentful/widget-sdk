import React, { createContext, useReducer, useContext } from 'react';
import type { State } from './types';

import { spacePurchaseReducer, Action } from './spacePurchaseReducer';

const initialState = {
  spaceRatePlans: [],
  spaceName: 'New space',
  selectedTemplate: null,
};

export const SpacePurchaseState = createContext<{ state: State; dispatch: React.Dispatch<Action> }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as any
);

export function useSpacePurchaseState<StateType = State>() {
  return useContext(SpacePurchaseState) as { state: StateType; dispatch: React.Dispatch<Action> };
}

export const SpacePurchaseContextProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(spacePurchaseReducer, initialState);

  return (
    <SpacePurchaseState.Provider value={{ dispatch, state }}>
      {children}
    </SpacePurchaseState.Provider>
  );
};

// eslint-disable-next-line rulesdir/restrict-multiple-react-component-exports
export const SpacePurchaseTestContextProvider: React.FC<{ additionalInitialState: State }> = ({
  children,
  additionalInitialState = {},
}) => {
  const [state, dispatch] = useReducer(spacePurchaseReducer, {
    ...initialState,
    ...additionalInitialState,
  });

  return (
    <SpacePurchaseState.Provider value={{ dispatch, state }}>
      {children}
    </SpacePurchaseState.Provider>
  );
};
