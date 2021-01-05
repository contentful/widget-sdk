import React from 'react';
import * as onboarding from 'components/shared/auto_create_new_space';
import * as TokenStore from 'services/TokenStore';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { render, screen, waitFor } from '@testing-library/react';

import { EmptyHomeRouter } from './HomeState';

const mockOrg = Fake.Organization({
  pricingVersion: 'pricing_version_2',
});
const mockOrg2 = Fake.Organization({
  pricingVersion: 'pricing_version_2',
});
const mockOrgPricingV1_1 = Fake.Organization({
  pricingVersion: 'pricing_version_1',
});
const mockOrgPricingV1_2 = Fake.Organization({
  pricingVersion: 'pricing_version_1',
});

jest.mock('components/shared/auto_create_new_space', () => ({
  init: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getOrganizations: jest.fn(),
}));

jest.mock('core/services/BrowserStorage', () => {
  const localStorage = {
    get: jest.fn(),
  };

  return {
    getBrowserStorage: () => localStorage,
  };
});

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

describe('EmptyHomeRouter', () => {
  beforeEach(() => {
    TokenStore.getOrganizations.mockResolvedValue([
      mockOrgPricingV1_1,
      mockOrgPricingV1_2,
      mockOrg,
      mockOrg2,
    ]);
  });

  it('should return if appsPurchase is not present', async () => {
    render(<EmptyHomeRouter />);

    expect(screen.getByTestId('empty-space-home.container')).toBeVisible();
  });

  it('should not enable onboarding if appsPurchase is present', async () => {
    render(<EmptyHomeRouter appsPurchase={true} />);

    await waitFor(() => expect(onboarding.init).not.toBeCalled());
  });

  it('should redirect to the lastUsedOrg purchase page if the lastUsedOrg is pricing v2', async () => {
    getBrowserStorage().get.mockReturnValueOnce(mockOrg2.sys.id);

    render(<EmptyHomeRouter appsPurchase={true} />);

    await waitFor(() =>
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'subscription_new', 'new_space'],
        params: { orgId: mockOrg2.sys.id },
        options: { location: 'replace' },
      })
    );
  });

  it('should redirect to the first available v2 org if the lastUsedOrg is pricing v1', async () => {
    getBrowserStorage().get.mockReturnValueOnce(mockOrgPricingV1_2.sys.id);

    render(<EmptyHomeRouter appsPurchase={true} />);

    await waitFor(() =>
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'subscription_new', 'new_space'],
        params: { orgId: mockOrg.sys.id },
        options: { location: 'replace' },
      })
    );
  });

  it('should redirect to the first v2 org in the token if the lastUsedOrg does not exist', async () => {
    getBrowserStorage().get.mockReturnValueOnce('unknown-org-id');

    render(<EmptyHomeRouter appsPurchase={true} />);

    await waitFor(() =>
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'subscription_new', 'new_space'],
        params: { orgId: mockOrg.sys.id },
        options: { location: 'replace' },
      })
    );
  });

  it('should not redirect and enable onboarding if no pricing v2 org was found', async () => {
    TokenStore.getOrganizations.mockResolvedValueOnce([mockOrgPricingV1_1, mockOrgPricingV1_2]);

    render(<EmptyHomeRouter appsPurchase={true} />);

    await Promise.all([
      waitFor(() => expect(go).not.toBeCalled()),
      waitFor(() => expect(onboarding.init).toBeCalled()),
    ]);
  });

  it('should not attempt to redirect and re-enable onboarding if no organization was found', async () => {
    TokenStore.getOrganizations.mockResolvedValueOnce([]);

    render(<EmptyHomeRouter appsPurchase={true} />);

    await Promise.all([
      waitFor(() => expect(go).not.toBeCalled()),
      waitFor(() => expect(onboarding.init).toBeCalled()),
    ]);
  });
});
