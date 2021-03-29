import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelHelpTable } from './LevelHelpTable';
import { LEVEL } from '../constants';

// TODO: LEVEL.DISABLED will crash this component!
// We should have a sub-enum ACTIVE_LEVEL or something like that instead.

it('does something', async () => {
  render(<LevelHelpTable currentLevel={LEVEL.MIGRATING} />);

  expect(await screen.findByTestId('embargoed-assets.urls')).toBeVisible();
});
