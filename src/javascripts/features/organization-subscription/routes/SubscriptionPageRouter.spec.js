import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import { getOrganization } from 'services/TokenStore';
import {
  getPlansWithSpaces,
  isLegacyEnterpriseOrEnterprisePlan,
  FREE,
  SELF_SERVICE,
  ENTERPRISE,
  ENTERPRISE_HIGH_DEMAND,
} from 'account/pricing/PricingDataProvider';
import { getAllProductRatePlans } from 'features/pricing-entities';
import { getVariation } from 'LaunchDarkly';
import { getSpaces } from 'services/TokenStore';
import { mockWebappContent } from '../components/__mocks__/webappContent';
import { OrgSubscriptionContextProvider } from '../context';

import { SubscriptionPageRouter } from './SubscriptionPageRouter';

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
jest.mock('data/isLegacyEnterprise', () => ({
  isLegacyEnterprise: jest.fn().mockReturnValue(false),
}));
jest.mock('utils/ResourceUtils', () => ({
  isLegacyOrganization: jest.fn().mockReturnValue(false),
}));
jest.mock('account/pricing/PricingDataProvider', () => ({
  getPlansWithSpaces: jest.fn().mockReturnValue([]),
  isEnterprisePlan: jest.fn().mockReturnValue(false),
  isFreeSpacePlan: jest.fn().mockReturnValue(true),
  isFreePlan: jest.fn().mockReturnValue(true),
  isPartnerPlan: jest.fn().mockReturnValue(false),
  isLegacyEnterpriseOrEnterprisePlan: jest.fn().mockReturnValue(false),
}));
jest.mock('features/pricing-entities', () => ({
  getAllProductRatePlans: jest.fn().mockReturnValue([]),
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
  // import mock for SpacePlans
  calculatePlansCost: jest.fn().mockReturnValue(1000),
  // import mock for BasePlan
  getEnabledFeatures: jest.fn().mockReturnValue([]),
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
jest.mock('../utils/utils', () => ({
  hasAnyInaccessibleSpaces: jest.fn().mockReturnValue(false),
}));
jest.mock('../hooks/useChangedSpace', () => ({
  useChangedSpace: jest
    .fn()
    .mockReturnValue({ changedSpaceId: 'random_id', setChangedSpaceId: jest.fn() }),
}));
// SubscriptionPage mocks
jest.mock('analytics/trackCTA', () => ({
  trackCTAClick: jest.fn(),
}));
jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
  getNotificationMessage: jest.fn(),
}));
jest.mock('services/ChangeSpaceService', () => ({
  beginSpaceChange: jest.fn(),
}));
jest.mock('features/space-settings', () => ({
  openDeleteSpaceDialog: jest.fn(),
}));

describe('SubscriptionPageRouter', () => {
  beforeEach(() => {
    getOrganization.mockResolvedValue(mockOrganization);
    getPlansWithSpaces.mockResolvedValue({ items: [mockFreeBasePlan] });
    getAllProductRatePlans.mockResolvedValue([mockProductRatePlan]);
    getSpaces.mockResolvedValue([mockSpace]);
    getVariation.mockResolvedValue(true);
  });

  it('renders the SubscriptionPage when the feature flag is OFF ', async () => {
    getVariation.mockResolvedValue(false);
    await build();

    expect(screen.getByTestId('subscription-page')).toBeVisible();
  });

  it('renders the SubscriptionPage when the basePlan is not included in the "TiersWithContent" list', async () => {
    const basePlanWithoutContent = { ...mockFreeBasePlan, customerType: 'Not in the list' };
    getPlansWithSpaces.mockResolvedValue({ items: [basePlanWithoutContent] });
    await build();

    expect(screen.getByTestId('subscription-page')).toBeVisible();
  });

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

  it('renders the EnterpriseSubscriptionPage for orgs with a "Enterprise" basePlan ', async () => {
    const enterpriseBasePlan = { ...mockFreeBasePlan, customerType: ENTERPRISE };
    getPlansWithSpaces.mockResolvedValue({ items: [enterpriseBasePlan] });
    isLegacyEnterpriseOrEnterprisePlan.mockReturnValue(true);
    await build();

    expect(screen.getByTestId('enterprise-subs-page')).toBeVisible();
  });

  it('renders the EnterpriseSubscriptionPage for orgs with a "Enterprise High Demand" basePlan ', async () => {
    const enterpriseBasePlan = { ...mockFreeBasePlan, customerType: ENTERPRISE_HIGH_DEMAND };
    getPlansWithSpaces.mockResolvedValue({ items: [enterpriseBasePlan] });
    isLegacyEnterpriseOrEnterprisePlan.mockReturnValue(true);
    await build();

    expect(screen.getByTestId('enterprise-subs-page')).toBeVisible();
  });
});

async function build(customProps) {
  const props = {
    orgId: mockOrganization.sys.id,
    ...customProps,
  };

  render(
    <OrgSubscriptionContextProvider>
      <SubscriptionPageRouter {...props} />
    </OrgSubscriptionContextProvider>
  );

  await waitFor(() => expect(screen.queryByTestId('subs-page-loading')).toBeNull());
}
