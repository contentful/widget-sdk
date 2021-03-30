import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelSelectionDialog } from './LevelSelectionDialog';
import { LEVEL } from '../constants';

const noopFn = (): void => {
  return;
};

it('renders', async () => {
  render(
    <LevelSelectionDialog currentLevel={LEVEL.MIGRATING} onSubmit={noopFn} onClose={noopFn} />
  );

  expect(await screen.findByTestId('change-protection-modal')).toBeVisible();
});
