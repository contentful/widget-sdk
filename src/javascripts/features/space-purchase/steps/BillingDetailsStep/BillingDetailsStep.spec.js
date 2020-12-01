import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpacePurchaseState } from '../../context';
import { BillingDetailsStep } from './BillingDetailsStep';

describe('BillingDetailsStep', () => {
  it('should render Billing Details page and Order Summary', () => {
    build();

    expect(screen.getByTestId('billing-details.card')).toBeVisible();
    expect(screen.getByTestId('order-summary.card')).toBeVisible();
  });
});

function build(customProps, customState) {
  const props = {
    onBack: () => {},
    onSubmit: () => {},
    ...customProps,
  };

  const contextValue = {
    state: { selectedPlan: { name: 'Medium', price: 123 }, ...customState },
    dispatch: jest.fn(),
  };

  render(
    <SpacePurchaseState.Provider value={contextValue}>
      <BillingDetailsStep {...props} />
    </SpacePurchaseState.Provider>
  );
}