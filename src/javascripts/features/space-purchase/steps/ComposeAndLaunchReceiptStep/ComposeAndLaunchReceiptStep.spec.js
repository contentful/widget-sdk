import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';

import { go } from 'states/Navigator';
import { renderWithProvider } from '../../__tests__/helpers';
import { PLATFORM_CONTENT, PlatformKind } from '../../utils/platformContent';
import { ComposeAndLaunchReceiptStep } from './ComposeAndLaunchReceiptStep';
import { addProductRatePlanToSubscription } from 'features/pricing-entities';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import * as TokenStore from 'services/TokenStore';
import { NO_SPACE_PLAN } from '../../context';

const mockOrganization = Fake.Organization();
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
}));

jest.mock('features/pricing-entities', () => ({
  addProductRatePlanToSubscription: jest.fn(),
}));

jest.mock('../../hooks/useSessionMetadata', () => ({
  useSessionMetadata: jest.fn().mockReturnValue('sessionData'),
}));

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: () => 'last_space_used_id',
  };

  return {
    getBrowserStorage: () => store,
  };
});

describe('ComposeAndLaunchReceiptStep', () => {
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
      `You successfully purchased the ${PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title} package`
    );
  });

  it('should take the user to the last used space when "take me to" button is clicked', async () => {
    build();
    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalled();
    });

    const redirectToSpace = screen.getByTestId('receipt-page.redirect-to-space');
    userEvent.click(redirectToSpace);

    expect(go).toBeCalledWith({
      path: ['spaces', 'detail'],
      params: { spaceId: 'last_space_used_id' },
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
