import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelHelpTable } from './LevelHelpTable';
import { LEVEL } from '../constants';

it('renders a table', async () => {
  render(<LevelHelpTable currentLevel={LEVEL.MIGRATING} />);
  expect(await screen.findByTestId('embargoed-assets.urls')).toBeVisible();
});
