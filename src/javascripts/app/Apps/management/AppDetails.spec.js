import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import AppDetails from './AppDetails';
import mockDefinitions from './__mocks__/mockDefinitions.json';

jest.mock('./ManagementApiClient', () => ({
  getCreatorNameOf: jest.fn(() => Promise.resolve()),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(() => Promise.resolve()),
}));

const props = {
  definition: mockDefinitions[0],
  goToListView: () => {},
  goToTab: jest.fn(),
  tab: '',
};

describe('AppDetails', () => {
  beforeEach(() => {});

  afterEach(cleanup);

  describe('When passed a tab that is implemented', () => {
    it('gos to the general tab', async () => {
      const localProps = { ...props, tab: 'events' };
      render(<AppDetails {...localProps} />);

      await wait();

      expect(props.goToTab).not.toHaveBeenCalled();
    });
  });

  describe('When passed a tab that is not implemented', () => {
    it('gos to the general tab', async () => {
      const localProps = { ...props, tab: 'not_a_real_tab' };
      render(<AppDetails {...localProps} />);

      await wait();

      expect(localProps.goToTab).toHaveBeenCalledWith('');
    });
  });
});
