import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmbargoedAssets } from './EmbargoedAssets';

/*
  This component is the parent of everything,
  it also keeps state and coordinates the transition between stages (loading, disabled, enabled).
  While we could write tons of unit tests here, integration tests might be more suitable to check
  for proper functionality and regressions.
*/

it('renders', async () => {
  render(<EmbargoedAssets />);
  expect(await screen.findByText('Protect your assets with secure URLs')).toBeVisible();
});
