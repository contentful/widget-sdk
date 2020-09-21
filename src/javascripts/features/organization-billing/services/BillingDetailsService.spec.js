import * as BillingDetailsService from './BillingDetailsService';
import { when } from 'jest-when';
import * as Fake from 'test/helpers/fakeFactory';

// eslint-disable-next-line
import { createOrganizationEndpoint, mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = Fake.Organization();
const mockInvoices = ['invoiceOne', 'invoiceTwo', 'invoiceThree'];

when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['billing_details'] }))
  .mockResolvedValue()
  .calledWith(expect.objectContaining({ path: ['invoices'] }))
  .mockResolvedValue({ items: mockInvoices });

describe('BillingDetailsService', () => {
  describe('createBillingDetails', () => {
    it('should make a PUT request to the default_payment_method endpoint', () => {
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

  describe('getBillingDetails', () => {
    it('should make a PUT request to the default_payment_method endpoint', () => {
      BillingDetailsService.getBillingDetails(mockOrganization.sys.id);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: ['billing_details'],
      });
    });
  });

  describe('getInvoices', () => {
    it('should make a PUT request to the default_payment_method endpoint', async () => {
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
