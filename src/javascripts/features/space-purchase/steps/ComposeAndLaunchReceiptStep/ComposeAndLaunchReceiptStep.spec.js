import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';

import { go } from 'states/Navigator';
import { renderWithProvider } from '../../__tests__/helpers';
import { PlatformKind } from '../../utils/platformContent';
import { ComposeAndLaunchReceiptStep } from './ComposeAndLaunchReceiptStep';
import { addProductRatePlanToSubscription } from 'features/pricing-entities';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import * as TokenStore from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { NO_SPACE_PLAN } from '../../context';

const mockOrganization = Fake.Organization();
const mockLastUsedSpace = Fake.Space();
const mockRandomSpaceFromOrganization = Fake.Space();
const mockcomposeAndLaunchProductRatePlan = Fake.Plan();
const mockSelectedPlatform = { type: PlatformKind.WEB_APP_COMPOSE_LAUNCH };

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  clearCachedProductCatalogFlags: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  refresh: jest.fn(),
  getSpacesByOrganization: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  addProductRatePlanToSubscription: jest.fn(),
}));

jest.mock('../../hooks/useSessionMetadata', () => ({
  useSessionMetadata: jest.fn().mockReturnValue('sessionData'),
}));

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: jest.fn(),
  };

  return {
    getBrowserStorage: jest.fn().mockReturnValue(store),
  };
});

describe('ComposeAndLaunchReceiptStep', () => {
  beforeEach(() => {
    getBrowserStorage().get.mockReturnValue(mockLastUsedSpace.sys.id);
    TokenStore.getSpacesByOrganization.mockReturnValue({
      [mockOrganization.sys.id]: [mockRandomSpaceFromOrganization, Fake.Space(), mockLastUsedSpace],
    });
  });

  it('should show message when Compose+Launch has been successfully ordered', async () => {
    build();

    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalledWith(
        expect.any(Function),
        mockcomposeAndLaunchProductRatePlan.sys.id
      );
      expect(clearCachedProductCatalogFlags).toBeCalled();
      expect(TokenStore.refresh).toBeCalled();
    });

    expect(screen.getByTestId('receipt.subtext').textContent).toContain(
      'You successfully added Compose + Launch to your organization. Install Compose + Launch on any space home.'
    );
  });

  describe('should take the user to the one of their spaces when "take me to" button is clicked', () => {
    it('should take the user to the last used space when there is a last used space', async () => {
      build();
      await waitFor(() => {
        expect(addProductRatePlanToSubscription).toBeCalled();
      });

      const redirectToSpace = screen.getByTestId('receipt-page.redirect-to-space');
      userEvent.click(redirectToSpace);

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockLastUsedSpace.sys.id },
      });
    });

    it('should take the user a space they have access to when they do no have access to the last used space', async () => {
      getBrowserStorage().get.mockReturnValue('no access space id');
      build();
      await waitFor(() => {
        expect(addProductRatePlanToSubscription).toBeCalled();
      });

      const redirectToSpace = screen.getByTestId('receipt-page.redirect-to-space');
      userEvent.click(redirectToSpace);

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockRandomSpaceFromOrganization.sys.id },
      });
    });

    it('should take the user to a space from their organization if there is no last used space', async () => {
      getBrowserStorage().get.mockReturnValue(null);
      TokenStore.getSpacesByOrganization.mockReturnValue({
        [mockOrganization.sys.id]: [mockRandomSpaceFromOrganization],
      });
      build();
      await waitFor(() => {
        expect(addProductRatePlanToSubscription).toBeCalled();
      });

      const redirectToSpace = screen.getByTestId('receipt-page.redirect-to-space');
      userEvent.click(redirectToSpace);

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockRandomSpaceFromOrganization.sys.id },
      });
    });
  });
});

function build() {
  renderWithProvider(ComposeAndLaunchReceiptStep, {
    organization: mockOrganization,
    selectedPlatform: mockSelectedPlatform,
    selectedPlan: NO_SPACE_PLAN,
    composeAndLaunchProductRatePlan: mockcomposeAndLaunchProductRatePlan,
  });
}
