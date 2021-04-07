import React from 'react';
import { ActiveBundle } from './ActiveBundle';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  HostingStateProvider,
  HostingStateProviderProps,
} from '../AppDetails/HostingStateProvider';
import { appBundleMock } from '../__mocks__/appBundles';

const renderInContext = (
  props,
  contextProps = {
    bundles: appBundleMock,
    defaultValue: true,
  }
) => {
  return render(
    <HostingStateProvider {...(contextProps as Omit<HostingStateProviderProps, 'children'>)}>
      <ActiveBundle {...props} />
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
  describe('when the saved bundle used src hosting', () => {
    it('renders the active url and a dropzone', () => {
      renderInContext({
        ...defaultProps,
        definition: {},
        savedDefinition: { src: 'https://www.cool.com' },
      });

      screen.getByText(/Self-hosted/);
      screen.getByText(/drag and drop your app/);
    });
  });
  describe('when the saved bundle uses bundle hosting', () => {
    it('renders an activeBundle and a dropzone', () => {
      renderInContext({ ...defaultProps });

      screen.getByText('Active');
      screen.getByText(/drag and drop your app/);
    });
  });
  describe('when the saved bundle contains no src or bundle', () => {
    it('just renders a dropzone', () => {
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

    it('renders a staged app instead of a dropzone', () => {
      expect(screen.queryByText(/drag and drop your app/)).toBeNull();
      screen.getByText(/This bundle becomes active on save/);
    });

    describe('when the cancel button is clicked', () => {
      it('calls resetDefinitionBundle', () => {
        fireEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.resetDefinitionBundle).toHaveBeenCalledTimes(1);
      });
    });
  });
});
