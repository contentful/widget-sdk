import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import {
  getPlansWithSpaces,
  isEnterprisePlan,
  FREE,
  SELF_SERVICE,
  ENTERPRISE,
  ENTERPRISE_HIGH_DEMAND,
  PARTNER_PLATFORM_BASE_PLAN_NAME,
} from 'account/pricing/PricingDataProvider';
import { MemoryRouter } from 'core/react-routing';
import { getSpaces, getOrganization } from 'services/TokenStore';

import { OrgSubscriptionContextProvider } from '../context';
import { mockWebappContent } from '../components/__mocks__/webappContent';
import { SubscriptionPageRoute } from './SubscriptionPageRoute';

const mockOrganization = Fake.Organization();
const mockFreeBasePlan = Fake.Plan({
  name: 'Community Platform',
  customerType: FREE,
  planType: 'base',
});
const mockProductRatePlan = Fake.Plan();
const mockSpace = Fake.Space();

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(),
  getSpaces: jest.fn(),
}));
jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn().mockReturnValue(true),
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getPlansWithSpaces: jest.fn().mockReturnValue([]),
  isFreeSpacePlan: jest.fn().mockReturnValue(true),
  isFreePlan: jest.fn().mockReturnValue(true),
  isPartnerPlan: jest.fn().mockReturnValue(false),
  isEnterprisePlan: jest.fn().mockReturnValue(false),
}));
jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn().mockResolvedValue({ usage: 2, limits: { maximum: 10 } }),
  };

  return () => resourceService;
});
jest.mock('utils/SubscriptionUtils', () => ({
  calcUsersMeta: jest.fn().mockReturnValue({
    numFree: 2,
    numPaid: 0,
    cost: 0,
    hardLimit: 5,
  }),
  calculateSubscriptionTotal: jest.fn().mockReturnValue(1000),
  // import mock for BasePlan
  getEnabledFeatures: jest.fn().mockReturnValue([]),
  calculateSubscriptionCosts: jest
    .fn()
    .mockReturnValue({ total: 100, lineItems: [{ name: 'spaces', price: 100 }] }),
}));
jest.mock('features/trials', () => ({
  AppTrialRepo: { getTrial: jest.fn() },
  isOrganizationOnTrial: jest.fn().mockReturnValue(false),
  canStartAppTrial: jest.fn().mockReturnValue(false),
  isActiveAppTrial: jest.fn().mockReturnValue(false),
  isExpiredAppTrial: jest.fn().mockReturnValue(false),
  useAppsTrial: jest.fn().mockReturnValue({ canStartTrial: true }),
}));

// NonEnterprise-, Enterprise-, and SubscriptionPage mocks
jest.mock('core/services/ContentfulCDA/fetchWebappContentByEntryID', () => ({
  fetchWebappContentByEntryID: jest.fn().mockResolvedValue(mockWebappContent),
}));
jest.mock('../hooks/useChangedSpace', () => ({
  useChangedSpace: jest
    .fn()
    .mockReturnValue({ changedSpaceId: 'random_id', setChangedSpaceId: jest.fn() }),
}));
jest.mock('../utils/generateBasePlanName', () => ({
  generateBasePlanName: jest.fn(),
}));

describe('SubscriptionPageRouter', () => {
  beforeEach(() => {
    getOrganization.mockResolvedValue(mockOrganization);
    getPlansWithSpaces.mockResolvedValue({ items: [mockFreeBasePlan] });
    getSpaces.mockResolvedValue([mockSpace]);
  });

  it('shows the ForbiddenPage if fetch fails', async () => {
    getSpaces.mockRejectedValueOnce(new Error());
    await build();

    expect(screen.getByTestId('forbidden-page')).toBeVisible();
  });

  describe('NonEnterpriseSubscriptionPage', () => {
    it('renders the NonEnterpriseSubscriptionPage for orgs with a "Free" basePlan ', async () => {
      await build();

      expect(screen.getByTestId('non-enterprise-subs-page')).toBeVisible();
    });

    it('renders the NonEnterpriseSubscriptionPage for orgs with a "Self-service" basePlan ', async () => {
      const selfServiceBasePlan = { ...mockFreeBasePlan, customerType: SELF_SERVICE };
      getPlansWithSpaces.mockResolvedValue({ items: [selfServiceBasePlan] });
      await build();

      expect(screen.getByTestId('non-enterprise-subs-page')).toBeVisible();
    });

    it('renders the NonEnterpriseSubscriptionPage for orgs with a "Partner" basePlan ', async () => {
      const partnerBasePlan = { ...mockFreeBasePlan, name: PARTNER_PLATFORM_BASE_PLAN_NAME };
      getPlansWithSpaces.mockResolvedValue({ items: [partnerBasePlan] });
      await build();

      expect(screen.getByTestId('non-enterprise-subs-page')).toBeVisible();
    });
  });

  describe('EnterpriseSubscriptionPage', () => {
    beforeEach(() => {
      isEnterprisePlan.mockReturnValue(true);
    });

    it('renders the EnterpriseSubscriptionPage for orgs with a "Enterprise" basePlan ', async () => {
      const enterpriseBasePlan = { ...mockFreeBasePlan, customerType: ENTERPRISE };
      getPlansWithSpaces.mockResolvedValue({ items: [enterpriseBasePlan] });
      await build();

      expect(screen.getByTestId('enterprise-subs-page')).toBeVisible();
    });

    it('renders the EnterpriseSubscriptionPage for orgs with a "Enterprise High Demand" basePlan ', async () => {
      const enterpriseBasePlan = { ...mockFreeBasePlan, customerType: ENTERPRISE_HIGH_DEMAND };
      getPlansWithSpaces.mockResolvedValue({ items: [enterpriseBasePlan] });
      await build();

      expect(screen.getByTestId('enterprise-subs-page')).toBeVisible();
    });
  });
});

async function build(customProps) {
  const props = {
    orgId: mockOrganization.sys.id,
    ...customProps,
  };
  const state = {
    basePlan: mockFreeBasePlan,
    spacePlans: [mockProductRatePlan],
    addOnPlans: [],
  };

  render(
    <MemoryRouter>
      <OrgSubscriptionContextProvider initialState={state}>
        <SubscriptionPageRoute {...props} />
      </OrgSubscriptionContextProvider>
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.queryByTestId('subs-page-loading')).toBeNull());
}
