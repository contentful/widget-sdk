import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnabledFeature } from './EnabledFeature';
import { LEVEL } from '../constants';

const noop = () => Promise.resolve();

it('does something', async () => {
  render(<EnabledFeature currentLevel={LEVEL.MIGRATING} setCurrentLevel={noop} />);

  expect(await screen.findByTestId('settings-section-card')).toBeVisible();
  expect(await screen.findByTestId('documentation-section-card')).toBeVisible();
  expect(await screen.findByTestId('danger-zone-section-card')).toBeVisible();
});
