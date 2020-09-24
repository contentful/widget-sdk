import { createBillingDetailsForAPI, convertBillingDetailsFromAPI } from './convertBillingDetails';

const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  address: '123 street ave',
  addressTwo: 'apartment 321',
  city: 'Berlin',
  postcode: '11111',
  country: 'DE',
  state: '',
  vatNumber: '',
};
const mockRefId = 'ref_1234';

const reconciledBillingDetails = {
  refid: mockRefId,
  firstName: mockBillingDetails.firstName,
  lastName: mockBillingDetails.lastName,
  vat: mockBillingDetails.vatNumber,
  workEmail: mockBillingDetails.email,
  address1: mockBillingDetails.address,
  address2: mockBillingDetails.addressTwo,
  city: mockBillingDetails.city,
  state: mockBillingDetails.state,
  country: mockBillingDetails.country,
  zipCode: mockBillingDetails.postcode,
};

const mockBillingDetailsFromAPI = {
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

describe('convertBillingDetails', () => {
  describe('createBillingDetailsForAPI', () => {
    it('should create billing details for the API', async () => {
      expect(createBillingDetailsForAPI(mockBillingDetails, mockRefId)).toEqual(
        reconciledBillingDetails
      );
    });
  });

  describe('convertBillingDetailsFromAPI', () => {
    it('should convert billing details to be consumed by the BillingInformation component', async () => {
      expect(convertBillingDetailsFromAPI(mockBillingDetailsFromAPI)).toEqual({
        ...mockBillingDetails,
        country: 'Germany',
      });
    });
  });
});
