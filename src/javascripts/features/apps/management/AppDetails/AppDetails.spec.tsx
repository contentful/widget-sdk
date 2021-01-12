import { render, wait } from '@testing-library/react';
import { noop } from 'lodash';
import React from 'react';
import mockDefinitions from '../__mocks__/mockDefinitions.json';
import { AppDetails } from './AppDetails';

jest.mock('../ManagementApiClient');

jest.mock('states/Navigator', () => ({
  go: jest.fn(() => Promise.resolve()),
}));

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' }),
}));

const props = {
  definition: mockDefinitions[0],
  events: { enabled: false, targetUrl: '', topics: [] },
  goToListView: noop,
  goToTab: jest.fn(),
  tab: '',
  setRequestLeaveConfirmation: jest.fn(),
  setDirty: jest.fn(),
};

describe('AppDetails', () => {
  describe('When passed a tab that is implemented', () => {
    it('gos to the general tab', async () => {
      const localProps: any = { ...props, tab: 'events' };
      render(<AppDetails {...localProps} />);

      await wait();

      expect(props.goToTab).not.toHaveBeenCalled();
    });
  });

  describe('When passed a tab that is not implemented', () => {
    it('gos to the general tab', async () => {
      const localProps: any = { ...props, tab: 'not_a_real_tab' };
      render(<AppDetails {...localProps} />);

      await wait();

      expect(localProps.goToTab).toHaveBeenCalledWith('');
    });
  });
});
