import { render, waitFor } from '@testing-library/react';
import { noop } from 'lodash';
import React from 'react';
import mockDefinitions from '../__mocks__/mockDefinitions.json';
import { AppDetails } from './AppDetails';
import { HostingStateProvider } from './HostingStateProvider';

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

const renderInContext = (props) =>
  render(
    <HostingStateProvider defaultValue={false} bundles={{ items: [] }}>
      <AppDetails {...props} />
    </HostingStateProvider>
  );

describe('AppDetails', () => {
  describe('When passed a tab that is implemented', () => {
    it('gos to the general tab', async () => {
      const localProps: any = { ...props, tab: 'events' };
      renderInContext({ ...localProps });

      await waitFor(() => {
        expect(props.goToTab).not.toHaveBeenCalled();
      });
    });
  });

  describe('When passed a tab that is not implemented', () => {
    it('gos to the general tab', async () => {
      const localProps: any = { ...props, tab: 'not_a_real_tab' };
      renderInContext({ ...localProps });

      await waitFor(() => {
        expect(localProps.goToTab).toHaveBeenCalledWith('');
      });
    });
  });
});
