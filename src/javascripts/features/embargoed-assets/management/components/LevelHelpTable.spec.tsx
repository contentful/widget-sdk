import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelHelpTable } from './LevelHelpTable';
import { LEVEL } from '../constants';

const item = async (testId) => {
  return await screen.findByTestId(testId);
};

describe('current state view', () => {
  describe('when in mode MIGRATING', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.MIGRATING} />);
      expect(await item('embargoed-assets.cma')).toHaveTextContent('PUBLIC');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('PUBLIC');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('PUBLIC');
    });
  });

  describe('when in mode UNPUBLISHED', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.UNPUBLISHED} />);
      expect(await item('embargoed-assets.cma')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('PUBLIC');
    });
  });

  describe('when in mode ALL', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.ALL} />);
      expect(await item('embargoed-assets.cma')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('SECURE');
    });
  });
});

describe('state transition view', () => {
  describe('when in transition from MIGRATING to UNPUBLISHED', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.MIGRATING} selectedLevel={LEVEL.UNPUBLISHED} />);

      expect(await item('embargoed-assets.cma')).toHaveTextContent('PUBLIC → SECURE');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('PUBLIC → SECURE');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('PUBLIC');
      expect(await item('embargoed-assets.cda')).not.toHaveTextContent('→');
    });
  });

  describe('when in transition from MIGRATING to ALL', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.MIGRATING} selectedLevel={LEVEL.ALL} />);

      expect(await item('embargoed-assets.cma')).toHaveTextContent('PUBLIC → SECURE');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('PUBLIC → SECURE');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('PUBLIC → SECURE');
    });
  });

  describe('when in transition from UNPUBLISHED to MIGRATING', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.UNPUBLISHED} selectedLevel={LEVEL.MIGRATING} />);

      expect(await item('embargoed-assets.cma')).toHaveTextContent('SECURE → PUBLIC');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('SECURE → PUBLIC');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('PUBLIC');
      expect(await item('embargoed-assets.cda')).not.toHaveTextContent('→');
    });
  });

  describe('when in transition from UNPUBLISHED to ALL', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.UNPUBLISHED} selectedLevel={LEVEL.ALL} />);

      expect(await item('embargoed-assets.cma')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cma')).not.toHaveTextContent('→');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cpa')).not.toHaveTextContent('→');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('PUBLIC → SECURE');
    });
  });

  describe('when in transition from ALL to UNPUBLISHED', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.ALL} selectedLevel={LEVEL.UNPUBLISHED} />);

      expect(await item('embargoed-assets.cma')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cma')).not.toHaveTextContent('→');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('SECURE');
      expect(await item('embargoed-assets.cpa')).not.toHaveTextContent('→');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('SECURE → PUBLIC');
    });
  });

  describe('when in transition from ALL to MIGRATING', () => {
    it('renders a table', async () => {
      render(<LevelHelpTable currentLevel={LEVEL.ALL} selectedLevel={LEVEL.MIGRATING} />);

      expect(await item('embargoed-assets.cma')).toHaveTextContent('SECURE → PUBLIC');
      expect(await item('embargoed-assets.cpa')).toHaveTextContent('SECURE → PUBLIC');
      expect(await item('embargoed-assets.cda')).toHaveTextContent('SECURE → PUBLIC');
    });
  });
});
