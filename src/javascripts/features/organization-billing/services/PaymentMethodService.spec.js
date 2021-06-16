import * as PaymentMethodService from './PaymentMethodService';
import { when } from 'jest-when';
import * as Fake from 'test/helpers/fakeFactory';

import {
  createOrganizationEndpoint,
  mockOrganizationEndpoint as mockEndpoint,
} from '__mocks__/data/EndpointFactory';

const mockOrganization = Fake.Organization();

when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['hosted_payment_params'] }))
  .mockResolvedValue()
  .calledWith(expect.objectContaining({ path: ['default_payment_method'] }))
  .mockResolvedValue();

describe('PaymentMethodService', () => {
  describe('getHostedPaymentParams', () => {
    it('should make a GET request to the hosted_payment_params endpoint', () => {
      PaymentMethodService.getHostedPaymentParams(mockOrganization.sys.id);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: ['hosted_payment_params'],
      });
    });

    it('should include a country_code query parameter if provide', () => {
      PaymentMethodService.getHostedPaymentParams(mockOrganization.sys.id, 'CX');

      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: ['hosted_payment_params'],
        query: { country_code: 'CX' },
      });
    });
  });
  describe('setDefaultPaymentMethod', () => {
    it('should make a PUT request to the default_payment_method endpoint', () => {
      const paymentMethodRefId = 'ref_1234';

      PaymentMethodService.setDefaultPaymentMethod(mockOrganization.sys.id, paymentMethodRefId);

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenCalledTimes(1);
      expect(mockEndpoint).toHaveBeenNthCalledWith(1, {
        method: 'PUT',
        path: ['default_payment_method'],
        data: {
          paymentMethodRefId,
        },
      });
    });
  });
});
