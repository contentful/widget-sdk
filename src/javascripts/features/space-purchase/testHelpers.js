import React, { useState, useContext, useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';

import { SpacePurchaseContextProvider, actions, SpacePurchaseState } from './context';

function ComponentEncapsulator({ children, initialState = {} }) {
  const [initialized, setInitialized] = useState(false);
  const { dispatch } = useContext(SpacePurchaseState);

  useEffect(() => {
    dispatch({
      type: actions.SET_INITIAL_STATE,
      payload: initialState,
    });

    setInitialized(true);
    // eslint-disable-next-line
  }, []);

  if (!initialized) {
    return null;
  }

  return children;
}

export async function renderWithProvider(RenderedComponent, initialState, props) {
  render(
    <SpacePurchaseContextProvider>
      <ComponentEncapsulator initialState={initialState}>
        <RenderedComponent {...props} />
      </ComponentEncapsulator>
    </SpacePurchaseContextProvider>
  );

  // Need to wait for the useEffect to fire
  await waitFor(() => {});
}
