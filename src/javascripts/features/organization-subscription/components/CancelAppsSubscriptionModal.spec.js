import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CancelAppsSubscriptionModal } from './CancelAppsSubscriptionModal';
import { removeAddOnPlanFromSubscription } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import { reload } from 'states/Navigator';
import { uninstalled } from 'features/apps';
import * as Fake from 'test/helpers/fakeFactory';

const mockOrganization = Fake.Organization();
const mockAddOnPlan = Fake.Plan();
const mockEndpoint = createOrganizationEndpoint(mockOrganization.sys.id);

jest.mock('features/pricing-entities', () => ({
  removeAddOnPlanFromSubscription: jest.fn(),
}));

jest.mock('features/apps', () => ({
  uninstalled: jest.fn(),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  clearCachedProductCatalogFlags: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  reload: jest.fn(),
}));

describe('CancelAppsSubscriptionModal', () => {
  it('should initially render with the confirm button disabled', () => {
    build();
    const confirmButton = screen.getByTestId('cancel-apps-confirm-button');
    expect(confirmButton).toHaveAttribute('disabled');
  });

  it('should enable the confirm button when any checkbox is checked', () => {
    build();
    const confirmButton = screen.getByTestId('cancel-apps-confirm-button');
    const randomIndex = getRandomInt(5);
    const checkbox = screen.getByTestId(`reason-${randomIndex}`);
    userEvent.click(within(checkbox).getByTestId('cf-ui-controlled-input'));
    expect(confirmButton).not.toHaveAttribute('disabled');
  });

  it('should close the modal when the cancel button is clicked', () => {
    const onClose = jest.fn();

    build({ onClose });
    const cancelButton = screen.getByTestId('cancel-button');
    userEvent.click(cancelButton);
    expect(onClose).toBeCalled();
  });

  it('should make a request and fire an analytics event when the confirm button is clicked', async () => {
    build();
    const confirmButton = screen.getByTestId('cancel-apps-confirm-button');
    const checkbox = screen.getByTestId('reason-0');
    const checkboxValue = within(checkbox)
      .getByTestId('cf-ui-controlled-input')
      .getAttribute('aria-label');
    userEvent.click(within(checkbox).getByTestId('cf-ui-controlled-input'));
    userEvent.click(confirmButton);

    await waitFor(() => {
      expect(removeAddOnPlanFromSubscription).toHaveBeenCalledWith(
        mockEndpoint,
        mockAddOnPlan.sys.id
      );
    });
    expect(uninstalled).toHaveBeenCalledWith('Compose + Launch', [checkboxValue]);
    expect(clearCachedProductCatalogFlags).toBeCalled();
    expect(reload).toBeCalled();
  });
});

function build(customProps) {
  const props = {
    isShown: true,
    onClose: () => {},
    organizationId: mockOrganization.sys.id,
    addOnPlan: mockAddOnPlan,
    ...customProps,
  };

  render(<CancelAppsSubscriptionModal {...props} />);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
