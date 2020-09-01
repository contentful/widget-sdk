import React from 'react';
import { render, screen } from '@testing-library/react';
import { NewSpaceBillingDetailsPage } from './NewSpaceBillingDetailsPage';

describe('NewSpaceBillingDetailsPage', () => {
  it('should render Billing Details page and Order Summary', () => {
    build();

    expect(screen.getByTestId('billing-details.card')).toBeVisible();
    expect(screen.getByTestId('order-summary.card')).toBeVisible();
  });
});

function build(customProps) {
  const props = {
    navigateToPreviousStep: () => {},
    onSubmitBillingDetails: () => {},
    selectedPlan: { name: 'Medium', price: 123 },
    ...customProps,
  };

  render(<NewSpaceBillingDetailsPage {...props} />);
}
