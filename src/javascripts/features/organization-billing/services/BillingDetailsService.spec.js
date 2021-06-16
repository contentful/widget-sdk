import * as BillingDetailsService from './BillingDetailsService';
import { when } from 'jest-when';
import * as Fake from 'test/helpers/fakeFactory';

import {
  createOrganizationEndpoint,
  mockOrganizationEndpoint as mockEndpoint,
} from '__mocks__/data/EndpointFactory';

const mockOrganization = Fake.Organization();
const mockInvoices = ['invoiceOne', 'invoiceTwo', 'invoiceThree'];
const mockBillingDetailsResp = {
  vat: 'DE123456',
  firstName: 'John',
  lastName: 'TestUser',
  address1: 'Teststr 123',
  country: 'Germany',
};

when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['billing_details'] }))
  .mockResolvedValue(mockBillingDetailsResp)
  .calledWith(expect.objectContaining({ path: ['invoices'] }))
  .mockResolvedValue({ items: mockInvoices });

describe('BillingDetailsService', () => {
  describe('createBillingDetails', () => {
    it('should make a POST request to the billing_details endpoint', () => {
      const mockBillingDetails = { randomField: '123' };

      BillingDetailsService.createBillingDetails(mockOrganization.sys.id, mockBillingDetails);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: ['billing_details'],
        data: mockBillingDetails,
      });
    });
  });

  describe('updateBillingDetails', () => {
    it('should make a PUT request to the billing_details endpoint', () => {
      const mockBillingDetails = { randomField: '123' };

      BillingDetailsService.updateBillingDetails(mockOrganization.sys.id, mockBillingDetails);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'PUT',
        path: ['billing_details'],
        data: mockBillingDetails,
      });
    });
  });

  describe('getBillingDetails', () => {
    it('should make a GET request to the billing_details endpint', async () => {
      const billingDetails = await BillingDetailsService.getBillingDetails(mockOrganization.sys.id);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: ['billing_details'],
      });

      expect(billingDetails).toEqual(mockBillingDetailsResp);
    });
  });

  describe('getInvoices', () => {
    it('should make a GET request to the invoices endpoint', async () => {
      const invoices = await BillingDetailsService.getInvoices(mockOrganization.sys.id);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: ['invoices'],
      });
      expect(invoices).toEqual(mockInvoices);
    });
  });

  describe('getInvoice', () => {
    it('should make a PUT request to the default_payment_method endpoint', () => {
      const mockInvoiceId = '12345';
      BillingDetailsService.getInvoice(mockOrganization.sys.id, mockInvoiceId);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: ['invoices', mockInvoiceId],
      });
    });
  });
});
