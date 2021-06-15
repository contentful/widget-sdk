import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { when } from 'jest-when';
import { DashboardRouter } from './DashboardRouter';
import * as Fake from 'test/helpers/fakeFactory';
import { isOwner } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import { isSelfServicePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider';

import { MemoryRouter } from 'core/react-routing';
import { go } from 'states/Navigator';

// eslint-disable-next-line
import { mockOrganizationEndpoint as mockEndpoint } from 'data/EndpointFactory';

jest.mock('account/pricing/PricingDataProvider', () => ({
  isSelfServicePlan: jest.fn(),
  isEnterprisePlan: jest.fn(),
}));

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
  beforeEach(() => {
    TokenStore.getOrganization.mockResolvedValue(mockOrganization);
    isSelfServicePlan.mockReturnValue(true);
    isEnterprisePlan.mockReturnValue(false);
  });

  it('should redirect to home if the user is not an org owner', async () => {
    isOwner.mockReturnValueOnce(false);

    build();

    await waitFor(expect(isOwner).toBeCalled);

    expect(go).toBeCalledWith({
      path: ['home'],
    });
  });

  it('should redirect to home if the organization is not in the token', async () => {
    TokenStore.getOrganization.mockRejectedValueOnce();

    build();

    await waitFor(expect(go).toBeCalled);

    expect(go).toHaveBeenCalledWith({
      path: ['home'],
    });
  });

  it('should request the org base plan and then invoices', async () => {
    isSelfServicePlan.mockReturnValue(false);
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

  it('should request the billing and payment details if the base plan is self-service', async () => {
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

  it('should show billing details to v2 self-service', async () => {
    build();

    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).toBeNull());

    expect(screen.getByTestId('billing-details-card')).toBeVisible();
  });

  it('should NOT show billing details to v2 enterprise', async () => {
    isSelfServicePlan.mockReturnValue(false);
    isEnterprisePlan.mockReturnValue(true);
    build();

    await waitFor(() => expect(screen.queryByTestId('invoices-loading')).toBeNull());

    expect(screen.queryByTestId('billing-details-card')).toBeNull();
  });
});

function build() {
  render(
    <MemoryRouter>
      <DashboardRouter orgId={mockOrganization.sys.id} />
    </MemoryRouter>
  );
}
