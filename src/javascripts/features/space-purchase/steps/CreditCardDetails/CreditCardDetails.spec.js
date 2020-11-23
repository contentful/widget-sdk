import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import * as LazyLoader from 'utils/LazyLoader';
import * as logger from 'services/logger';
import cleanupNotifications from 'test/helpers/cleanupNotifications';

import { SpacePurchaseState } from '../../context';
import { CreditCardDetails } from './CreditCardDetails';

const mockOrganization = Fake.Organization();

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

jest.useFakeTimers();

describe('steps/CreditCardDetails', () => {
  afterEach(cleanupNotifications);

  it('should call navigateToPreviousStep if the Zuora iframe cancel button is clicked', async () => {
    const navigateToPreviousStep = jest.fn();

    await build({ navigateToPreviousStep });

    fireEvent.click(screen.getByTestId('zuora-iframe.cancel-button'));

    expect(navigateToPreviousStep).toBeCalled();
  });

  it('should call onSuccess if the Zuora success response callback is called', async () => {
    const onSuccess = jest.fn();

    const { successCb } = await build({ onSuccess });

    expect(onSuccess).not.toBeCalled();

    successCb();

    expect(onSuccess).toBeCalled();
  });

  it('should notify the user something went wrong if onSuccess fails', async () => {
    const onSuccess = jest.fn().mockRejectedValueOnce();

    const { successCb } = await build({ onSuccess });

    expect(onSuccess).not.toBeCalled();

    successCb();

    expect(onSuccess).toBeCalled();

    await waitFor(() => screen.getByTestId('cf-ui-notification'));

    expect(screen.getByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
  });

  it('should log and show an error notification if the Zuora error response callback is called', async () => {
    const { errorCb } = await build();

    const response = errorCb();

    await waitFor(() => screen.getByTestId('cf-ui-notification'));

    expect(logger.logError).toBeCalledWith('ZuoraIframeError', {
      ...response,
      location: 'account.organizations.subscription_new.new_space',
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
      organizationId: mockOrganization.sys.id,
      billingCountryCode: 'CX',
      navigateToPreviousStep: () => {},
      onSuccess: () => {},
    },
    customProps
  );

  const contextValue = {
    state: { selectedPlan: { name: 'Medium', price: 123 }, ...customState },
    dispatch: jest.fn(),
  };

  render(
    <SpacePurchaseState.Provider value={contextValue}>
      <CreditCardDetails {...props} />
    </SpacePurchaseState.Provider>
  );

  await waitFor(() => expect(Zuora.renderWithErrorHandler).toBeCalled());

  return { successCb, errorCb };
}
