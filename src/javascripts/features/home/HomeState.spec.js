import React from 'react';
import * as onboarding from 'components/shared/auto_create_new_space';
import * as TokenStore from 'services/TokenStore';
import * as Fake from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { render, screen, waitFor } from '@testing-library/react';
import { PRESELECT_VALUES } from 'features/space-purchase';
import { setQueryParameters } from 'test/helpers/setQueryParameters';

import { EmptyHomeRouter } from './HomeState';
import { router } from 'core/react-routing';

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
  getSpaces: jest.fn().mockResolvedValue([]),
  getUserSync: jest.fn(),
}));

jest.mock('core/services/BrowserStorage', () => {
  const localStorage = {
    get: jest.fn(),
    forKey: jest.fn(),
  };

  return {
    getBrowserStorage: () => localStorage,
  };
});

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('core/react-routing', () => ({
  ...jest.requireActual('core/react-routing'),
  router: {
    navigate: jest.fn(),
  },
}));

describe('EmptyHomeRouter', () => {
  beforeEach(() => {
    TokenStore.getOrganizations.mockResolvedValue([
      mockOrgPricingV1_1,
      mockOrgPricingV1_2,
      mockOrg,
      mockOrg2,
    ]);

    TokenStore.getSpaces.mockResolvedValue([]);
    TokenStore.getUserSync.mockReturnValue({
      organizationMemberships: [
        {
          organization: mockOrg,
        },
      ],
    });
  });

  afterEach(() => {
    setQueryParameters();
  });

  it('should render the empty home component if appsPurchase is false', async () => {
    render(<EmptyHomeRouter />);

    await waitFor(() => expect(screen.queryByTestId('cf-ui-loading-state')).toBeNull());

    expect(screen.getByTestId('empty-space-home.container')).toBeVisible();
  });

  describe('with appsPurchase query param', () => {
    beforeEach(() => {
      setQueryParameters({ appsPurchase: true });
    });

    it('should redirect to the lastUsedOrg purchase page if the lastUsedOrg is pricing v2', async () => {
      getBrowserStorage().get.mockReturnValueOnce(mockOrg2.sys.id);

      render(<EmptyHomeRouter />);

      await waitFor(() => expect(router.navigate).toBeCalled());

      expect(router.navigate).toBeCalledWith(
        {
          path: 'organizations.subscription.newSpace',
          orgId: mockOrg2.sys.id,
          navigationState: { from: 'marketing_cta', preselect: PRESELECT_VALUES.APPS },
        },
        { location: 'replace' }
      );
    });

    it('should redirect to the first available v2 org if the lastUsedOrg is pricing v1', async () => {
      getBrowserStorage().get.mockReturnValueOnce(mockOrgPricingV1_2.sys.id);

      render(<EmptyHomeRouter />);
      await waitFor(() => expect(router.navigate).toBeCalled());

      expect(router.navigate).toBeCalledWith(
        {
          path: 'organizations.subscription.newSpace',
          orgId: mockOrg.sys.id,
          navigationState: { from: 'marketing_cta', preselect: PRESELECT_VALUES.APPS },
        },
        { location: 'replace' }
      );
    });

    it('should redirect to the first v2 org in the token if the lastUsedOrg does not exist', async () => {
      getBrowserStorage().get.mockReturnValueOnce('unknown-org-id');

      render(<EmptyHomeRouter />);
      await waitFor(() => expect(router.navigate).toBeCalled());

      expect(router.navigate).toBeCalledWith(
        {
          path: 'organizations.subscription.newSpace',
          orgId: mockOrg.sys.id,
          navigationState: { from: 'marketing_cta', preselect: PRESELECT_VALUES.APPS },
        },
        { location: 'replace' }
      );
    });

    it('should not redirect and enable onboarding if no pricing v2 org was found', async () => {
      TokenStore.getOrganizations.mockResolvedValueOnce([mockOrgPricingV1_1, mockOrgPricingV1_2]);

      render(<EmptyHomeRouter />);

      await waitFor(() => expect(onboarding.init).toBeCalled());

      expect(go).not.toBeCalled();
      expect(router.navigate).not.toBeCalled();
    });

    it('should not attempt to redirect and re-enable onboarding if no organization was found', async () => {
      TokenStore.getOrganizations.mockResolvedValueOnce([]);

      render(<EmptyHomeRouter />);

      await waitFor(() => expect(onboarding.init).toBeCalled());

      expect(go).not.toBeCalled();
      expect(router.navigate).not.toBeCalled();
    });
  });
});
