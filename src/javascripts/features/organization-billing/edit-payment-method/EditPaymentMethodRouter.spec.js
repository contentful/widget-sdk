import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { when } from 'jest-when';
import { EditPaymentMethodRouter } from './EditPaymentMethodRouter';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';
import cleanupNotifications from 'test/helpers/cleanupNotifications';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';
import * as LazyLoader from 'utils/LazyLoader';

const mockOrganization = Fake.Organization();
const mockHostedPaymentParams = {
  key: 'some-key',
};

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

  it('should first get the variation and redirect if it is false', async () => {
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

  it('should get the Zuora JS and the hosted payment params', async () => {
    build();

    await waitFor(() => expect(LazyLoader.get).toBeCalled());

    expect(LazyLoader.get).toHaveBeenCalledWith('Zuora');
    expect(mockEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ path: ['hosted_payment_params'] })
    );
  });

  it('should render and set a runAfterRender callback', async () => {
    build();

    await waitFor(() => expect(LazyLoader.get).toBeCalled());

    const { Zuora } = LazyLoader._results;
    expect(Zuora.render).toBeCalledWith(mockHostedPaymentParams, {}, expect.any(Function));
    expect(Zuora.runAfterRender).toBeCalledWith(expect.any(Function));
  });

  it('should show a loading state until the runAfterRender callback is called', async () => {
    const { Zuora } = LazyLoader._results;

    let runAfterRenderCb;

    Zuora.runAfterRender.mockImplementationOnce((cb) => (runAfterRenderCb = cb));

    build();

    await waitFor(() => expect(Zuora.render).toBeCalled());

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeVisible();
    expect(screen.getByTestId('zuora-payment-iframe')).not.toBeVisible();

    await waitFor(() => runAfterRenderCb());

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeNull();
    expect(screen.getByTestId('zuora-payment-iframe')).toBeVisible();
  });

  describe('payment method successfully created', () => {
    const successResult = { refId: 'ref_1234' };
    let successCb;

    beforeEach(async () => {
      const { Zuora } = LazyLoader._results;

      Zuora.render.mockImplementationOnce((_params, _prefilledFields, cb) => (successCb = cb));

      build();

      await waitFor(() => expect(Zuora.render).toBeCalled());
    });

    it('should set the default payment method and redirect when the success callback is called', async () => {
      await waitFor(() => successCb(successResult));

      expect(mockEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          path: ['default_payment_method'],
          method: 'PUT',
          data: {
            paymentMethodRefId: successResult.refId,
          },
        })
      );
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'billing-gatekeeper'],
      });
    });

    it('should show a notification if the default payment method request fails', async () => {
      mockEndpoint.mockRejectedValueOnce();

      successCb(successResult);

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
      expect(go).not.toBeCalled();
    });
  });
});

function build() {
  render(<EditPaymentMethodRouter orgId={mockOrganization.sys.id} />);
}
