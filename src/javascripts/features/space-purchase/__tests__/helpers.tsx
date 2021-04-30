import React from 'react';
import { render } from '@testing-library/react';

import type { State } from '../context';
import { SpacePurchaseTestContextProvider } from '../context';

export function renderWithProvider<ComponentPropsType = any>(
  RenderedComponent: React.FC<ComponentPropsType>,
  additionalInitialState: State,
  props: ComponentPropsType
) {
  render(
    <SpacePurchaseTestContextProvider additionalInitialState={additionalInitialState}>
      <RenderedComponent {...props} />
    </SpacePurchaseTestContextProvider>
  );
}
