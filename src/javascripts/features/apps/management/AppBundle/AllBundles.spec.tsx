import React from 'react';
import { AllBundles } from './AllBundles';
import { render, screen } from '@testing-library/react';
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
      <AllBundles {...props} />
    </HostingStateProvider>
  );
};
describe('AllBundles', () => {
  it('renders all bundles', () => {
    const definition = {
      bundle: {
        sys: { id: 'my-bundle-id' },
      },
    };
    renderInContext({ definition, savedDefinition: definition, onChange: jest.fn() });
    expect(screen.getAllByTestId('app-bundle.card')).toHaveLength(3);
  });
  describe('when definition contains a bundle that exists in context', () => {
    it('does not render that bundle in the list', () => {
      const bundleId = appBundleMock.items[0].sys.id;
      const definition = {
        bundle: {
          sys: { id: bundleId },
        },
      };
      renderInContext({ definition, savedDefinition: definition, onChange: jest.fn() });
      expect(screen.getAllByTestId('app-bundle.card')).toHaveLength(2);
      expect(screen.queryByText(bundleId)).toBeNull();
    });
  });
  describe('when savedDefinition also contains a bundle that exists in context', () => {
    it('does not render that bundle in the list either', () => {
      const bundleId = appBundleMock.items[0].sys.id;
      const definition = {
        bundle: {
          sys: { id: bundleId },
        },
      };
      const otherBundleId = appBundleMock.items[1].sys.id;
      const savedDefinition = {
        bundle: {
          sys: { id: otherBundleId },
        },
      };
      renderInContext({ definition, savedDefinition, onChange: jest.fn() });
      expect(screen.getAllByTestId('app-bundle.card')).toHaveLength(1);
      expect(screen.queryByText(bundleId)).toBeNull();
      expect(screen.queryByText(otherBundleId)).toBeNull();
    });
  });
});
