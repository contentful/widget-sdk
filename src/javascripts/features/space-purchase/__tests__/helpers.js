import React from 'react';
import { render } from '@testing-library/react';

import { SpacePurchaseTestContextProvider } from '../context';

export function renderWithProvider(RenderedComponent, additionalInitialState, props) {
  render(
    <SpacePurchaseTestContextProvider additionalInitialState={additionalInitialState}>
      <RenderedComponent {...props} />
    </SpacePurchaseTestContextProvider>
  );
}
