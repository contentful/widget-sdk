import { when } from 'jest-when';
import { waitFor, screen, fireEvent } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import * as TokenStore from 'services/TokenStore';
import * as LazyLoader from 'utils/LazyLoader';
import { captureError } from 'core/monitoring';
import cleanupNotifications from 'test/helpers/cleanupNotifications';

import { CreditCardDetailsStep } from './CreditCardDetailsStep';
import { renderWithProvider } from '../../__tests__/helpers';

// eslint-disable-next-line
import { mockOrganizationEndpoint as mockEndpoint } from 'data/EndpointFactory';

when(mockEndpoint)
  .calledWith(expect.objectContaining({ method: 'POST', path: ['billing_details'] }))
  .mockResolvedValue()
  .calledWith(expect.objectContaining({ method: 'PUT', path: ['default_payment_method'] }))
  .mockResolvedValue()
  .calledWith(expect.objectContaining({ method: 'GET', path: ['default_payment_method'] }))
  .mockResolvedValue();

const mockOrganization = Fake.Organization();
const mockBillingDetails = {
  country: 'Armenia',
};

const mockRefId = 'ref_1234';

jest.mock('utils/LazyLoader', () => {
  const results = {
    Zuora: {
      renderWithErrorHandler: jest.fn(),
      runAfterRender: jest.fn((cb) => cb()),
    },
  };

  return {
    _results: results,
    get: jest.fn().mockImplementation((key) => results[key]),
  };
});

jest.mock('services/TokenStore', () => ({
  refresh: jest.fn().mockResolvedValue(),
}));

jest.useFakeTimers();

describe('steps/CreditCardDetailsStep', () => {
  afterEach(cleanupNotifications);

  it('should call onBack if the Zuora iframe cancel button is clicked', async () => {
    const onBack = jest.fn();

    await build({ onBack });

    fireEvent.click(screen.getByTestId('zuora-iframe.cancel-button'));

    expect(onBack).toBeCalled();
  });

  it('should make some requests and call onSubmit if the Zuora success response callback is called', async () => {
    const onSubmit = jest.fn();

    const { successCb } = await build({ onSubmit });

    expect(onSubmit).not.toBeCalled();

    successCb();

    await waitFor(() => expect(mockEndpoint).toBeCalled());

    expect(mockEndpoint).toBeCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: ['billing_details'],
        data: {
          ...mockBillingDetails,
          refid: mockRefId,
        },
      })
    );

    expect(mockEndpoint).toBeCalledWith(
      expect.objectContaining({
        method: 'PUT',
        path: ['default_payment_method'],
        data: {
          paymentMethodRefId: mockRefId,
        },
      })
    );

    expect(mockEndpoint).toBeCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: ['default_payment_method'],
      })
    );

    expect(TokenStore.refresh).toBeCalled();
    expect(onSubmit).toBeCalled();
  });

  it('should log and notify the user, and not call onSubmit if something went wrong during submission', async () => {
    const error = new Error('oops');
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ method: 'POST', path: ['billing_details'] }))
      .mockRejectedValueOnce(error);

    const onSubmit = jest.fn();

    const { successCb } = await build({ onSubmit });

    expect(onSubmit).not.toBeCalled();

    successCb();

    await waitFor(() => expect(mockEndpoint).toBeCalled());

    expect(captureError).toBeCalledWith(error, {
      extra: {
        organizationId: mockOrganization.sys.id,
      },
    });

    expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
  });

  it('should log and show an error notification if the Zuora error response callback is called', async () => {
    const { errorCb } = await build();

    const response = errorCb();

    await waitFor(() => screen.getByTestId('cf-ui-notification'));

    expect(captureError).toBeCalledWith(expect.any(Error), {
      extra: {
        error: response,
        location: 'account.organizations.subscription_new.new_space',
      },
    });

    expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
  });
});

async function build(customProps, customState) {
  const { Zuora } = LazyLoader._results;

  let successCb;
  let errorCb;

  Zuora.renderWithErrorHandler.mockImplementationOnce((_params, _prefilledFields, cb) => {
    successCb = () => {
      const response = { success: true, refId: 'ref_1234' };

      cb(response);

      return response;
    };

    errorCb = () => {
      const response = { success: false, errorCode: 'Something_Went_Wrong' };

      cb(response);

      return response;
    };
  });

  const props = Object.assign(
    {
      track: () => {},
      onBack: () => {},
      onSubmit: () => {},
    },
    customProps
  );

  await renderWithProvider(
    CreditCardDetailsStep,
    {
      selectedPlan: {
        name: 'Medium',
        price: 123,
      },
      organization: mockOrganization,
      billingDetails: mockBillingDetails,
      ...customState,
    },
    props
  );

  await waitFor(() => expect(Zuora.renderWithErrorHandler).toBeCalled());

  return { successCb, errorCb };
}
