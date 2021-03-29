import React from 'react';
import { render, screen } from '@testing-library/react';
import { TurnOffDialog } from './TurnOffDialog';

const noopFn = (): void => {
  return;
};

it('renders warning text', async () => {
  render(<TurnOffDialog onSubmit={noopFn} onClose={noopFn} />);

  expect(await screen.findByTestId('turn-off-modal')).toHaveTextContent(
    'All assets will become unprotected and accessible.'
  );
});
