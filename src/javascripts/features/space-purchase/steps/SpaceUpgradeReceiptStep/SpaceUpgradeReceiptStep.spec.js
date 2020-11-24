import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { changeSpacePlan } from 'account/pricing/PricingDataProvider';
import { trackEvent, EVENTS } from '../../utils/analyticsTracking';

import { SpacePurchaseState } from '../../context';
import { SpaceUpgradeReceiptStep } from './SpaceUpgradeReceiptStep';

const mockSelectedPlan = FakeFactory.Plan();
const mockOrganization = FakeFactory.Organization();
const mockCurrentSpace = FakeFactory.Space();
const mockSessionMetadata = {
  organizationId: mockOrganization.sys.id,
  sessionId: 'some_random_id',
  spaceId: mockCurrentSpace.sys.id,
};

jest.mock('data/EndpointFactory', () => ({
  createSpaceEndpoint: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  changeSpacePlan: jest.fn(),
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

    userEvent.click(screen.getByTestId('receipt-page.redirect-to-upgraded-space'));

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

    const redirectToChangedSpace = screen.getByTestId('receipt-page.redirect-to-upgraded-space');
    expect(redirectToChangedSpace).toHaveAttribute('disabled');
    expect(within(redirectToChangedSpace).getByTestId('cf-ui-spinner')).toBeVisible();
    expect(screen.getByTestId('receipt.loading-envelope')).toBeVisible();
  });

  it('should redirect to the new space when clicking on the button after the space has been', async () => {
    build();

    const redirectToChangedSpace = screen.getByTestId('receipt-page.redirect-to-upgraded-space');

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
});

function build(customState) {
  const contextValue = {
    state: {
      organization: mockOrganization,
      currentSpace: mockCurrentSpace,
      selectedPlan: mockSelectedPlan,
      sessionId: mockSessionMetadata.sessionId,
      ...customState,
    },
    dispatch: jest.fn(),
  };

  render(
    <SpacePurchaseState.Provider value={contextValue}>
      <SpaceUpgradeReceiptStep />
    </SpacePurchaseState.Provider>
  );
}
