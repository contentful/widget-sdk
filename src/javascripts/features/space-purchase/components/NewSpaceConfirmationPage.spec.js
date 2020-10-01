import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';

import { NewSpaceConfirmationPage } from './NewSpaceConfirmationPage';

const mockOrganization = Fake.Organization();
const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  workEmail: 'test@example.com',
  address1: '123 street ave',
  address2: 'apartment 321',
  city: 'Berlin',
  zipCode: '11111',
  country: 'Germany',
  state: '',
  vat: '',
};
const mockPaymentMethod = {
  number: '************1111',
  expirationDate: { month: 3, year: 2021 },
};

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

describe('NewSpaceConfirmationPage', () => {
  it('should not show the edit link when org does not billing information', () => {
    build();

    expect(screen.queryByTestId('confirmation-page.edit-billing-link')).toBeNull();
  });

  it('should show the edit link when org has billing information', () => {
    build({ hasBillingInformation: true });

    const editBillingLink = screen.getByTestId('confirmation-page.edit-billing-link');

    expect(editBillingLink).toBeVisible();

    userEvent.click(editBillingLink);

    expect(go).toHaveBeenCalledWith({
      path: ['account', 'organizations', 'billing'],
      params: { orgId: mockOrganization.sys.id },
    });
  });

  it('should not show a loading state if the payment and billing details have loaded', () => {
    build();

    expect(screen.queryByTestId('billing-details-loading')).toBeNull();
    expect(screen.queryByTestId('credit-card-details-loading')).toBeNull();
  });

  it('should show a loading state if the payment and billing details are loading', () => {
    build({ isLoadingBillingDetails: true });

    expect(screen.getByTestId('billing-details-loading')).toBeVisible();
    expect(screen.getByTestId('credit-card-details-loading')).toBeVisible();
  });
});

function build(customProps) {
  const props = {
    organizationId: mockOrganization.sys.id,
    selectedPlan: { name: 'medium' },
    billingDetails: mockBillingDetails,
    paymentMethod: mockPaymentMethod,
    isLoadingBillingDetails: false,
    hasBillingInformation: false,
    onConfirm: () => {},
    navigateToPreviousStep: () => {},
    ...customProps,
  };

  render(<NewSpaceConfirmationPage {...props} />);
}
