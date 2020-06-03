import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingInfo from './BillingInfo';

describe('BillingInfo', () => {
  it('should not show a button to go to the billing page if canSetupBilling is false', () => {
    build();

    expect(screen.getByTestId('payment-details-missing')).toBeVisible();
  });

  it('should show a button to go to the billing page if canSetupBilling is true', () => {
    build({ canSetupBilling: true });

    expect(screen.getByTestId('go-to-billing-link')).toBeVisible();
  });

  it('should call goToBilling if the billing button is clicked', () => {
    const goToBilling = jest.fn();

    build({ canSetupBilling: true, goToBilling });

    userEvent.click(screen.getByTestId('go-to-billing-link'));

    expect(goToBilling).toBeCalled();
  });
});

function build(custom) {
  const props = Object.assign(
    {
      canSetupBilling: false,
      goToBilling: () => {},
    },
    custom
  );

  render(<BillingInfo {...props} />);
}
