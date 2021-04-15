import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnabledFeature } from './EnabledFeature';
import { levelDescription, SwitchableLevels, SWITCHABLE_LEVEL } from '../constants';

const noop = () => Promise.resolve();

describe('when level is MIGRATING', () => {
  it('renders basic cards', async () => {
    render(<EnabledFeature currentLevel={SWITCHABLE_LEVEL.MIGRATING} setCurrentLevel={noop} />);

    expect(await screen.findByTestId('settings-section-card')).toBeVisible();
    expect(await screen.findByTestId('documentation-section-card')).toBeVisible();
    expect(await screen.findByTestId('danger-zone-section-card')).toBeVisible();
  });
});

const testableLevels: SwitchableLevels = Object.values(SWITCHABLE_LEVEL);

for (const currentLevel of testableLevels) {
  describe(`when level is ${currentLevel}`, () => {
    it('renders level heading', async () => {
      render(<EnabledFeature currentLevel={currentLevel} setCurrentLevel={noop} />);

      expect(await screen.findByTestId('embargoed-assets-current-mode')).toHaveTextContent(
        levelDescription[currentLevel]
      );
    });
  });
}
