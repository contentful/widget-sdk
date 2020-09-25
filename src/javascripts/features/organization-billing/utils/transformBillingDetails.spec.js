import { transformBillingDetails } from './transformBillingDetails';

describe('transformBillingDetails', () => {
  it('should transform the raw API billing details to the expected shape', () => {
    const mockAPIBillingDetails = {
      firstName: 'John',
      lastName: 'Doe',
      workEmail: 'test@example.com',
      vat: '',
      address: {
        address1: '123 street ave',
        address2: 'apartment 321',
        city: 'Berlin',
        zipCode: '11111',
        country: 'Germany',
        state: '',
      },
    };

    expect(transformBillingDetails(mockAPIBillingDetails)).toEqual({
      firstName: mockAPIBillingDetails.firstName,
      lastName: mockAPIBillingDetails.lastName,
      workEmail: mockAPIBillingDetails.workEmail,
      vat: mockAPIBillingDetails.vat,
      address1: mockAPIBillingDetails.address.address1,
      address2: mockAPIBillingDetails.address.address2,
      city: mockAPIBillingDetails.address.city,
      state: mockAPIBillingDetails.address.state,
      country: mockAPIBillingDetails.address.country,
      zipCode: mockAPIBillingDetails.address.zipCode,
    });
  });
});
