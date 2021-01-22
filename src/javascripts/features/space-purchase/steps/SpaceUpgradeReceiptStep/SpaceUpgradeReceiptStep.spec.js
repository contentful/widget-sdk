import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { changeSpacePlan } from 'account/pricing/PricingDataProvider';
import { trackEvent, EVENTS } from '../../utils/analyticsTracking';
import { addProductRatePlanToSubscription } from 'features/pricing-entities';

import { renderWithProvider } from '../../__tests__/helpers';
import { SpaceUpgradeReceiptStep } from './SpaceUpgradeReceiptStep';
import { PLATFORM_TYPES } from '../../utils/platformContent';

const mockSelectedPlan = FakeFactory.Plan();
const mockOrganization = FakeFactory.Organization();
const mockCurrentSpace = FakeFactory.Space();
const mockComposeProductRatePlan = FakeFactory.Plan();

const mockSelectedPlatform = { type: PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH };
const mockSessionMetadata = {
  organizationId: mockOrganization.sys.id,
  sessionId: 'some_random_id',
  spaceId: mockCurrentSpace.sys.id,
};

jest.mock('account/pricing/PricingDataProvider', () => ({
  changeSpacePlan: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  addProductRatePlanToSubscription: jest.fn(),
}));

jest.mock('../../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../../utils/analyticsTracking').EVENTS,
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

describe('SpaceUpgradeReceiptStep', () => {
  beforeEach(() => {
    changeSpacePlan.mockResolvedValue(mockCurrentSpace);
  });

  it('should call changeSpacePlan and fire an analytic event', async () => {
    build();

    await waitFor(() => {
      expect(changeSpacePlan).toHaveBeenCalled();
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_TYPE_CHANGE, mockSessionMetadata, {
      selectedPlan: mockSelectedPlan,
    });
  });

  it('should display an error and fire an analytic event if the change of the space errored', async () => {
    const err = new Error('Something went wrong');
    changeSpacePlan.mockRejectedValueOnce(err);
    build();

    await waitFor(() => {
      expect(screen.getByTestId('receipt.error-face')).toBeVisible();
    });

    expect(trackEvent).toHaveBeenCalledWith(EVENTS.ERROR, mockSessionMetadata, {
      errorType: 'UpgradeError',
      error: err,
    });
  });

  it('should restart the space change if it errs and the user clicks the button again', async () => {
    changeSpacePlan.mockRejectedValueOnce(new Error('Something went wrong'));
    build();

    await waitFor(() => {
      expect(screen.getByTestId('receipt.error-face')).toBeVisible();
    });

    expect(changeSpacePlan).toHaveBeenCalledTimes(1);

    userEvent.click(screen.getByTestId('receipt-page.redirect-to-space'));

    await waitFor(() => {
      expect(changeSpacePlan).toHaveBeenCalledTimes(2);
    });
  });

  it('should display a loading state while changing the space', async () => {
    let changeSpacePromise;
    changeSpacePlan.mockImplementationOnce(() => {
      changeSpacePromise = new Promise(() => {});
      return changeSpacePromise;
    });
    build();

    const redirectToChangedSpace = screen.getByTestId('receipt-page.redirect-to-space');
    expect(redirectToChangedSpace).toHaveAttribute('disabled');
    expect(within(redirectToChangedSpace).getByTestId('cf-ui-spinner')).toBeVisible();
    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();
  });

  it('should redirect to the new space when clicking on the button after the space has been', async () => {
    build();

    const redirectToChangedSpace = screen.getByTestId('receipt-page.redirect-to-space');

    await waitFor(() => {
      expect(redirectToChangedSpace.hasAttribute('disabled')).toBeFalsy();
    });

    userEvent.click(redirectToChangedSpace);

    await waitFor(() => {
      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockCurrentSpace.sys.id },
      });
    });
  });

  it('should add compose+launch to the subscription if the selectedPlatform is SPACE_COMPOSE_LAUNCH', async () => {
    build({ selectedPlatform: mockSelectedPlatform });

    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalledWith(
        expect.any(Function),
        mockComposeProductRatePlan.sys.id
      );
    });
  });

  it('should change the space plan and purchase the addon serially and show a loading state the entire time', async () => {
    let resolveChangeSpacePlan;

    changeSpacePlan.mockImplementationOnce(
      () =>
        new Promise((resolve) => (resolveChangeSpacePlan = resolve.bind(null, mockCurrentSpace)))
    );

    build({ selectedPlatform: mockSelectedPlatform });

    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();

    await waitFor(() => expect(changeSpacePlan).toBeCalled());
    expect(addProductRatePlanToSubscription).not.toBeCalled();

    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();

    resolveChangeSpacePlan();

    await waitFor(() => {
      expect(addProductRatePlanToSubscription).toBeCalled();
    });

    expect(screen.queryByTestId('receipt.loading-envelope')).toBeNull();
  });

  it('should show an error if addon purchase erred', async () => {
    const err = new Error('Something went wrong');
    addProductRatePlanToSubscription.mockRejectedValueOnce(err);

    build({ selectedPlatform: mockSelectedPlatform });

    await waitFor(() => {
      expect(screen.getByTestId('receipt.error-face')).toBeVisible();
    });
  });
});

function build(customState) {
  renderWithProvider(SpaceUpgradeReceiptStep, {
    organization: mockOrganization,
    currentSpace: mockCurrentSpace,
    selectedPlan: mockSelectedPlan,
    composeProductRatePlan: mockComposeProductRatePlan,
    sessionId: mockSessionMetadata.sessionId,
    ...customState,
  });
}
