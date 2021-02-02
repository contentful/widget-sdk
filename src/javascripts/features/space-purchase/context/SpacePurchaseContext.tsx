import React, { createContext, useReducer, useContext } from 'react';
import type { State } from './types';

import { spacePurchaseReducer, Action } from './spacePurchaseReducer';

interface SpacePurchaseContext<S = State> {
  state: S;
  dispatch: React.Dispatch<Action>;
}

const initialState: State = {
  spaceRatePlans: [],
  spaceName: 'New space',
};

export const SpacePurchaseState = createContext<SpacePurchaseContext>(({
  state: initialState,
} as unknown) as SpacePurchaseContext);

export function useSpacePurchaseState<StateType = State>() {
  return useContext(SpacePurchaseState) as SpacePurchaseContext<StateType>;
}

export const SpacePurchaseContextProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(spacePurchaseReducer, initialState);

  return (
    <SpacePurchaseState.Provider value={{ dispatch, state }}>
      {children}
    </SpacePurchaseState.Provider>
  );
};

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
