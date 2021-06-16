import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { when } from 'jest-when';
import { EditPaymentMethodRouter } from './EditPaymentMethodRouter';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { isOwner } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import cleanupNotifications from 'test/helpers/cleanupNotifications';
import { captureError } from 'core/monitoring';
import { MemoryRouter } from 'core/react-routing';

// eslint-disable-next-line
import { mockOrganizationEndpoint as mockEndpoint } from 'data/EndpointFactory';
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
  href: jest.fn(),
}));

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

when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['hosted_payment_params'] }))
  .mockResolvedValue(mockHostedPaymentParams);

jest.useFakeTimers();

describe('EditPaymentMethodRouter', () => {
  afterEach(cleanupNotifications);

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
    let errorCb;

    beforeEach(async () => {
      build();
      const cbs = await waitForZuoraToRender();

      successCb = cbs.successCb;
      errorCb = cbs.errorCb;
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
    });

    it('should log the error and show an error notification if the Zuora iframe errors when rendering', async () => {
      const response = errorCb();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(captureError).toBeCalledWith(expect.any(Error), {
        extra: {
          error: response,
          location: 'account.organizations.billing.edit-payment-method',
        },
      });
      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
    });

    it('should show an error notification if the default payment method request fails', async () => {
      mockEndpoint.mockRejectedValueOnce();

      successCb();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
    });

    it('should show a success notification if the request succeeds', async () => {
      successCb();

      await waitFor(() => screen.getByTestId('cf-ui-notification'));

      expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'success');
    });
  });
});

function build() {
  render(
    <MemoryRouter>
      <EditPaymentMethodRouter orgId={mockOrganization.sys.id} />
    </MemoryRouter>
  );
}

async function waitForZuoraToRender() {
  const { Zuora } = LazyLoader._results;

  let runAfterRenderCb;
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

  Zuora.runAfterRender.mockImplementationOnce((cb) => (runAfterRenderCb = cb));

  await waitFor(() => expect(Zuora.renderWithErrorHandler).toBeCalled());

  await waitFor(runAfterRenderCb);

  expect(screen.getByTestId('zuora-iframe.iframe-element')).toBeVisible();

  return { successCb, errorCb };
}
