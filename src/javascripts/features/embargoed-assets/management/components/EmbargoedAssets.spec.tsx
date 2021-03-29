import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmbargoedAssets } from './EmbargoedAssets';

it('does something', async () => {
  render(<EmbargoedAssets />);
  expect(await screen.findByText('Protect your assets with secure URLs')).toBeVisible();
});
