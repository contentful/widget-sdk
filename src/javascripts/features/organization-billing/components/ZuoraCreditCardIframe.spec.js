import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { when } from 'jest-when';
import { ZuoraCreditCardIframe } from './ZuoraCreditCardIframe';
import * as Fake from 'test/helpers/fakeFactory';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';
import * as LazyLoader from 'utils/LazyLoader';

const mockOrganization = Fake.Organization();
const mockHostedPaymentParams = {
  key: 'some-key',
};

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

describe('ZuoraCreditCardIframe', () => {
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
    const successResult = { success: true, refId: 'ref_1234' };
    const errorResult = { success: false, someError: 'something' };

    let onSuccess;
    let onError;
    let responseCb;

    beforeEach(async () => {
      const { Zuora } = LazyLoader._results;

      Zuora.render.mockImplementationOnce((_params, _prefilledFields, cb) => (responseCb = cb));
      onSuccess = jest.fn();
      onError = jest.fn();

      build({ onSuccess, onError });

      await waitFor(() => expect(Zuora.render).toBeCalled());
    });

    it('should call the success callback if response.success is true', async () => {
      await waitFor(() => responseCb(successResult));

      expect(onSuccess).toBeCalledWith(successResult);
    });

    it('should call the error callback of response.success is not true', async () => {
      await waitFor(() => responseCb(errorResult));

      expect(onError).toBeCalledWith(errorResult);
    });
  });
});

function build(customProps) {
  const props = Object.assign(
    {
      organizationId: mockOrganization.sys.id,
      onSuccess: () => {},
      onError: () => {},
    },
    customProps
  );

  render(<ZuoraCreditCardIframe {...props} />);
}
