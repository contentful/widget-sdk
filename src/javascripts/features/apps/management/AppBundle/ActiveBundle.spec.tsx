import React from 'react';
import { ActiveBundle } from './ActiveBundle';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  HostingStateProvider,
  HostingStateProviderProps,
} from '../AppDetails/HostingStateProvider';
import { appBundleMock } from '../__mocks__/appBundles';
import {
  AppDetailsStateContextValue,
  AppDetailsStateContext,
} from '../AppDetails/AppDetailsStateContext';

jest.mock('data/userCache', () =>
  jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({
      firstName: 'user',
      lastName: 'user',
      avatarUrl: 'https://www.urls.com',
      sys: {
        type: 'User',
        id: '2LSyXwc717JeKfw5DIgg6W',
      },
    }),
  })
);
const renderInContext = (
  props,
  contextProps = {
    bundles: appBundleMock,
    defaultValue: true,
    orgId: 'myOrg',
  }
) => {
  return render(
    <HostingStateProvider {...(contextProps as Omit<HostingStateProviderProps, 'children'>)}>
      <AppDetailsStateContext.Provider
        value={
          ({
            draftDefinition: props.definition,
            setDraftDefinition: jest.fn(),
            savedDefinition: props.savedDefinition,
            resetDefinitionBundle: props.resetDefinitionBundle,
          } as any) as AppDetailsStateContextValue
        }>
        <ActiveBundle {...props} />
      </AppDetailsStateContext.Provider>
    </HostingStateProvider>
  );
};

const bundleId = appBundleMock.items[0].sys.id;
const definition = {
  bundle: { sys: { id: bundleId } },
};

const defaultProps = {
  onChange: jest.fn(),
  definition: definition,
  savedDefinition: definition,
  resetDefinitionBundle: jest.fn(),
};

describe('ActiveBundle', () => {
  describe('when the saved bundle uses bundle hosting', () => {
    it('renders an activeBundle and a dropzone', async () => {
      renderInContext({ ...defaultProps });

      await waitFor(() => {
        screen.getByText('Active');
      });
      screen.getByText(/drag and drop your app/);
    });
  });
  describe('when the saved bundle contains no src or bundle', () => {
    it('just renders a dropzone', async () => {
      renderInContext({ ...defaultProps, definition: {}, savedDefinition: {} });

      expect(screen.queryByText('Active')).toBeNull();
      expect(screen.queryByText(/Self-hosted/)).toBeNull();
      screen.getByText(/drag and drop your app/);
    });
  });
  describe('when a new bundle is staged', () => {
    beforeEach(() => {
      const newBundleId = appBundleMock.items[1].sys.id;
      const definitionWithStagedBundle = { bundle: { sys: { id: newBundleId } } };
      renderInContext({
        ...defaultProps,
        definition: definitionWithStagedBundle,
        savedDefinition: {},
      });
    });

    it('renders a staged app instead of a dropzone', async () => {
      await waitFor(() => {
        expect(screen.queryByText(/drag and drop your app/)).toBeNull();
      });
      screen.getByText(/This bundle becomes active on save/);
    });

    describe('when the cancel button is clicked', () => {
      it('calls resetDefinitionBundle', async () => {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Cancel'));
        });
        expect(defaultProps.resetDefinitionBundle).toHaveBeenCalledTimes(1);
      });
    });
  });
});
