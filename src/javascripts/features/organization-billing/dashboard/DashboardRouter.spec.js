import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { when } from 'jest-when';
import { DashboardRouter } from './DashboardRouter';
import * as Fake from 'test/helpers/fakeFactory';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';

const mockBasePlanSelfService = Fake.Plan({
  planType: 'base',
  customerType: 'Self-service',
});

const mockBasePlanEnterprise = Fake.Plan({
  planType: 'base',
  customerType: 'Enterprise',
});

when(mockEndpoint)
  .calledWith(expect.objectContaining({ path: ['plans'] }))
  .mockResolvedValue({ items: [mockBasePlanEnterprise] })
  .calledWith(expect.objectContaining({ path: ['invoices'] }))
  .mockResolvedValue({ items: [] })
  .calledWith(expect.objectContaining({ path: ['billing_details'] }))
  .mockResolvedValue({ address: {} })
  .calledWith(expect.objectContaining({ path: ['default_payment_method'] }))
  .mockResolvedValue({ number: '', expirationDate: { month: 1, year: 2099 } });

const mockOrganization = Fake.Organization();

describe('DashboardRouter', () => {
  it('should request the org base plan and then invoices', async () => {
    build();

    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).toBeNull());

    expect(mockEndpoint).toBeCalledTimes(2);

    expect(mockEndpoint).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: ['plans'],
      }),
      expect.any(Object)
    );

    expect(mockEndpoint).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: ['invoices'],
      })
    );
  });

  it('should request the billing and payment details if the base plan is not enterprise', async () => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['plans'] }))
      .mockResolvedValueOnce({ items: [mockBasePlanSelfService] });

    build();

    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).toBeNull());

    expect(mockEndpoint).toBeCalledTimes(4);

    expect(mockEndpoint).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: ['plans'],
      }),
      expect.any(Object)
    );

    expect(mockEndpoint).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: ['invoices'],
      })
    );

    expect(mockEndpoint).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        path: ['billing_details'],
      })
    );

    expect(mockEndpoint).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        path: ['default_payment_method'],
      })
    );
  });
});

function build() {
  render(<DashboardRouter orgId={mockOrganization.sys.id} />);
}
