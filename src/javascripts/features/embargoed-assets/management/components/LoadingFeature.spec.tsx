import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingFeature } from './LoadingFeature';

it('renders a loading section', async () => {
  render(<LoadingFeature />);
  expect(await screen.findByTestId('loading-section-card')).toBeVisible();
});
