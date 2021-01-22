import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';

import { go } from 'states/Navigator';
import { getSpace } from 'services/TokenStore';
import { renderWithProvider } from '../../__tests__/helpers';
import { PLATFORM_CONTENT, PLATFORM_TYPES } from '../../utils/platformContent';
import { ComposeAndLaunchReceiptStep } from './ComposeAndLaunchReceiptStep';
import { addProductRatePlanToSubscription } from 'features/pricing-entities';

const mockOrganization = Fake.Organization();
const mockLastUsedSpace = Fake.Space();
const mockComposeProductRatePlan = Fake.Plan();
const mockSelectedPlatform = { type: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH };

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  addProductRatePlanToSubscription: jest.fn(),
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
  beforeEach(() => {
    getSpace.mockResolvedValue(mockLastUsedSpace);
  });

  it('should show message when Compose+Launch has been successfully ordered', async () => {
    build();

    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalledWith(
        expect.any(Function),
        mockComposeProductRatePlan.sys.id
      );
    });

    expect(screen.getByTestId('receipt.subtext').textContent).toContain(
      `You successfully purchased the ${PLATFORM_CONTENT.composePlatform.title} package`
    );
  });

  it('should take the user to the last used space when "take me to" button is clicked', async () => {
    build();
    await waitFor(expect(getSpace).toBeCalled);

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
    composeProductRatePlan: mockComposeProductRatePlan,
  });
}
