import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { when } from 'jest-when';
import { ZuoraCreditCardIframe } from './ZuoraCreditCardIframe';
import * as Fake from 'test/helpers/fakeFactory';

// eslint-disable-next-line
import { mockOrganizationEndpoint } from 'data/EndpointFactory';
import * as LazyLoader from 'utils/LazyLoader';

const mockOrganization = Fake.Organization();
const mockHostedPaymentParams = {
  key: 'some-key',
};

jest.mock('utils/LazyLoader', () => {
  const results = {
    Zuora: {
      renderWithErrorHandler: jest.fn(),
      runAfterRender: jest.fn(),
    },
  };

  return {
    _results: results,
    get: jest.fn().mockImplementation((key) => results[key]),
  };
});

when(mockOrganizationEndpoint)
  .calledWith(expect.objectContaining({ path: ['hosted_payment_params'] }))
  .mockResolvedValue(mockHostedPaymentParams);

jest.useFakeTimers();

describe('ZuoraCreditCardIframe', () => {
  it('should get the Zuora JS and the hosted payment params', async () => {
    build();

    await waitFor(() => expect(LazyLoader.get).toBeCalled());

    expect(LazyLoader.get).toHaveBeenCalledWith('Zuora');
    expect(mockOrganizationEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ path: ['hosted_payment_params'] })
    );
  });

  it('should call the hosted payment params API with a country code is provided', async () => {
    build({ countryCode: 'CX' });

    await waitFor(() => expect(LazyLoader.get).toBeCalled());

    expect(mockOrganizationEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ path: ['hosted_payment_params'], query: { country_code: 'CX' } })
    );
  });

  it('should render and set a runAfterRender callback', async () => {
    build();

    await waitFor(() => expect(LazyLoader.get).toBeCalled());

    const { Zuora } = LazyLoader._results;
    expect(Zuora.renderWithErrorHandler).toBeCalledWith(
      mockHostedPaymentParams,
      {},
      expect.any(Function),
      expect.any(Function)
    );
    expect(Zuora.runAfterRender).toBeCalledWith(expect.any(Function));
  });

  it('should show a loading state until the runAfterRender callback is called', async () => {
    const { Zuora } = LazyLoader._results;

    let runAfterRenderCb;

    Zuora.runAfterRender.mockImplementationOnce((cb) => (runAfterRenderCb = cb));

    build();

    await waitFor(() => expect(Zuora.renderWithErrorHandler).toBeCalled());

    expect(screen.getByTestId('zuora-iframe.loading')).toBeVisible();
    expect(screen.getByTestId('zuora-iframe.iframe-element')).not.toBeVisible();

    await waitFor(() => runAfterRenderCb());

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeNull();
    expect(screen.getByTestId('zuora-iframe.iframe-element')).toBeVisible();
  });

  it('should use the provided cancelText for the cancel button, and call onCancel if it is clicked', async () => {
    const onCancel = jest.fn();

    build({ onCancel, cancelText: 'Back' });

    expect(screen.getByTestId('zuora-iframe.cancel-button').textContent).toBe('Back');

    fireEvent.click(screen.getByTestId('zuora-iframe.cancel-button'));

    await waitFor(() => {
      expect(onCancel).toBeCalled();
    });
  });

  describe('payment method successfully created', () => {
    const successResult = { success: true, refId: 'ref_1234' };
    const errorResult = { success: false, someError: 'something' };

    let onSuccess;
    let onError;
    let responseCb;

    beforeEach(async () => {
      const { Zuora } = LazyLoader._results;

      Zuora.renderWithErrorHandler.mockImplementationOnce(
        (_params, _prefilledFields, cb) => (responseCb = cb)
      );
      onSuccess = jest.fn();
      onError = jest.fn();

      build({ onSuccess, onError });

      await waitFor(() => expect(Zuora.renderWithErrorHandler).toBeCalled());
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
      onCancel: () => {},
    },
    customProps
  );

  render(<ZuoraCreditCardIframe {...props} />);
}
