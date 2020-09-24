import React from 'react';
import { render, screen } from '@testing-library/react';
import { BillingInformation } from './BillingInformation';

const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  address: '123 street ave',
  addressTwo: 'apartment 321',
  city: 'Rio de Janeiro',
  postcode: '11111',
  country: 'BR',
};

// Prevent from mutating mockBillingDetails
Object.freeze(mockBillingDetails);

describe('BillingInformation', () => {
  it('should render the required billing information', () => {
    build();

    for (const key in mockBillingDetails) {
      // Need the exact false otherwise will not recognize 'John' in 'John Doe'
      expect(screen.getByText(mockBillingDetails[key], { exact: false })).toBeVisible();
    }
  });

  it('should display VAT if there is a VAT', () => {
    const mockBillingDetailsWithVAT = { ...mockBillingDetails, vatNumber: 'BR123456' };
    build({ billingInfo: mockBillingDetailsWithVAT });

    expect(screen.getByText('BR123456')).toBeVisible();
  });

  it('should display State if there is a State', () => {
    const mockBillingDetailsWithState = { ...mockBillingDetails, state: 'California' };
    build({ billingInfo: mockBillingDetailsWithState });

    expect(screen.getByText('California')).toBeVisible();
  });

  it('should display the country name if given a country code', () => {
    const mockBillingDetailsWithState = { ...mockBillingDetails, country: 'BR' };
    build({ billingInfo: mockBillingDetailsWithState });

    expect(screen.getByText('Brazil')).toBeVisible();
  });

  it('should display the country name if given a country name', () => {
    const mockBillingDetailsWithState = { ...mockBillingDetails, country: 'Brazil' };
    build({ billingInfo: mockBillingDetailsWithState });

    expect(screen.getByText('Brazil')).toBeVisible();
  });
});

function build(customProps) {
  const props = {
    billingInfo: mockBillingDetails,
    ...customProps,
  };

  render(<BillingInformation {...props} />);
}
