import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { when } from 'jest-when';
import { EditPaymentMethodRouter } from './EditPaymentMethodRouter';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';
import { isOwner } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import cleanupNotifications from 'test/helpers/cleanupNotifications';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';
import * as LazyLoader from 'utils/LazyLoader';

const mockOrganization = Fake.Organization();
const mockHostedPaymentParams = {
  key: 'some-key',
};

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn().mockResolvedValue({}),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn().mockReturnValue(true),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('utils/LazyLoader', () => {
  const results = {
    Zuora: {
      render: jest.fn(),
      runAfterRender: jest.fn(),
    },
  };

  return {
    _results: results,
    get: jest.fn().mockImplementation((key) => results[key]),
  };
});

when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['hosted_payment_params'] }))
  .mockResolvedValue(mockHostedPaymentParams);

jest.useFakeTimers();

describe('EditPaymentMethodRouter', () => {
  afterEach(cleanupNotifications);

  it('should first get the variation and redirect to the old billing flow if it is false', async () => {
    getVariation.mockResolvedValueOnce(false);

    build();

    await waitFor(() => expect(getVariation).toBeCalled());

    expect(go).toHaveBeenCalledWith({
      path: ['account', 'organizations', 'billing-gatekeeper'],
    });

    expect(LazyLoader.get).not.toBeCalled();
    expect(mockEndpoint).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: ['hosted_payment_params'] })
    );
  });

  it('should redirect to home if the user is not an org owner', async () => {
    isOwner.mockReturnValueOnce(false);

    build();

    await waitFor(expect(isOwner).toBeCalled);

    expect(go).toHaveBeenCalledWith({
      path: ['home'],
    });

    expect(LazyLoader.get).not.toBeCalled();
    expect(mockEndpoint).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: ['hosted_payment_params'] })
    );
  });

  it('should redirect to home if the organization is not in the token', async () => {
    TokenStore.getOrganization.mockRejectedValueOnce();

    build();

    await waitFor(expect(go).toBeCalled);

    expect(go).toHaveBeenCalledWith({
      path: ['home'],
    });

    expect(LazyLoader.get).not.toBeCalled();
    expect(mockEndpoint).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: ['hosted_payment_params'] })
    );
  });

  describe('payment method successfully created', () => {
    let successCb;

    beforeEach(async () => {
      build();
      successCb = await waitForZuoraToRender();
    });

    it('should set the default payment method and redirect when the success callback is called', async () => {
      const response = successCb();

      await waitFor(() => expect(mockEndpoint).toBeCalled());

      expect(mockEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          path: ['default_payment_method'],
          method: 'PUT',
          data: {
            paymentMethodRefId: response.refId,
          },
        })
      );
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'billing-gatekeeper'],
      });
    });

    it('should show a notification if the default payment method request fails', async () => {
      mockEndpoint.mockRejectedValueOnce();

      successCb();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
      expect(go).not.toBeCalled();
    });
  });
});

function build() {
  render(<EditPaymentMethodRouter orgId={mockOrganization.sys.id} />);
}

async function waitForZuoraToRender() {
  const { Zuora } = LazyLoader._results;

  let runAfterRenderCb;
  let successCb;

  Zuora.render.mockImplementationOnce(
    (_params, _prefilledFields, cb) =>
      (successCb = () => {
        const response = { success: true, refId: 'ref_1234' };

        cb(response);

        // For simplified testing, return the response here as well
        return response;
      })
  );

  Zuora.runAfterRender.mockImplementationOnce((cb) => (runAfterRenderCb = cb));

  await waitFor(() => expect(Zuora.render).toBeCalled());

  await waitFor(runAfterRenderCb);

  expect(screen.getByTestId('zuora-payment-iframe')).toBeVisible();

  return successCb;
}
