import React from 'react';
import { AllBundles } from './AllBundles';
import { render, screen, waitFor } from '@testing-library/react';
import {
  HostingStateProvider,
  HostingStateProviderProps,
} from '../AppDetails/HostingStateProvider';
import { appBundleMock } from '../__mocks__/appBundles';

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
      <AllBundles {...props} />
    </HostingStateProvider>
  );
};
describe('AllBundles', () => {
  it('renders all bundles', async () => {
    const definition = {
      bundle: {
        sys: { id: 'my-bundle-id' },
      },
    };
    renderInContext({ definition, savedDefinition: definition, onChange: jest.fn() });
    await waitFor(() => {
      expect(screen.getAllByTestId('app-bundle.card')).toHaveLength(3);
    });
  });
  describe('when definition contains a bundle that exists in context', () => {
    it('does not render that bundle in the list', async () => {
      const bundleId = appBundleMock.items[0].sys.id;
      const definition = {
        bundle: {
          sys: { id: bundleId },
        },
      };
      renderInContext({ definition, savedDefinition: definition, onChange: jest.fn() });

      await waitFor(() => {
        expect(screen.getAllByTestId('app-bundle.card')).toHaveLength(2);
      });
      expect(screen.queryByText(bundleId)).toBeNull();
    });
  });
  describe('when savedDefinition also contains a bundle that exists in context', () => {
    it('does not render that bundle in the list either', async () => {
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
      await waitFor(() => {
        expect(screen.getAllByTestId('app-bundle.card')).toHaveLength(1);
      });
      expect(screen.queryByText(bundleId)).toBeNull();
      expect(screen.queryByText(otherBundleId)).toBeNull();
    });
  });
});
