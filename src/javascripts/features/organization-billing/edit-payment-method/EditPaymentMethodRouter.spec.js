import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { when } from 'jest-when';
import { EditPaymentMethodRouter } from './EditPaymentMethodRouter';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';

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

describe('EditPaymentMethodRouter', () => {
  it('should first get the variation and redirect if it is false', async () => {
    getVariation.mockResolvedValueOnce(false);

    build();

    await waitFor(() => expect(getVariation).toBeCalled());

    expect(go).toHaveBeenCalledWith({
      path: ['account', 'organizations', 'billing-iframe'],
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
});

function build() {
  render(<EditPaymentMethodRouter orgId={mockOrganization.sys.id} />);
}
