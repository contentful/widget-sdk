import React from 'react';
import { render, screen } from '@testing-library/react';
import { BillingInformation } from './BillingInformation';

const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  workEmail: 'test@example.com',
  address1: '123 street ave',
  address2: 'apartment 321',
  city: 'Rio de Janeiro',
  zipCode: '11111',
  country: 'Brazil',
};

Object.freeze(mockBillingDetails);

describe('BillingInformation', () => {
  it('should render the required billing information', () => {
    build();

    for (const key in mockBillingDetails) {
      // Need the exact false otherwise will not recognize 'John' in 'John Doe'
      expect(screen.getByText(mockBillingDetails[key], { exact: false })).toBeVisible();
    }
  });

  it('should display VAT if there is VAT in the billing details', () => {
    const mockBillingDetailsWithVAT = { ...mockBillingDetails, vat: 'BR123456' };
    build({ billingDetails: mockBillingDetailsWithVAT });

    expect(screen.getByText('BR123456')).toBeVisible();
  });

  it('should display state if the billing details has state', () => {
    const mockBillingDetailsWithState = { ...mockBillingDetails, state: 'California' };
    build({ billingDetails: mockBillingDetailsWithState });

    expect(screen.getByText('California')).toBeVisible();
  });
});

function build(customProps) {
  const props = {
    billingDetails: mockBillingDetails,
    ...customProps,
  };

  render(<BillingInformation {...props} />);
}
