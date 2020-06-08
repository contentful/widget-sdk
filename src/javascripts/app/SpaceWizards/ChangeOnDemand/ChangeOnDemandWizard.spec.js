import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import ChangeOnDemandWizard from './ChangeOnDemandWizard';
import * as Fake from 'test/helpers/fakeFactory';
import { getSpaceRatePlans } from 'account/pricing/PricingDataProvider';
import { transformSpaceRatePlans } from '../shared/utils';

const mockOrganization = Fake.Organization();
const mockSpace = Fake.Space();

const mockFreeSpaceResource = {
  usage: 1,
  limits: {
    maximum: 5,
  },
};
const mockPlan = Fake.Plan({
  productPlanType: 'free_space',
  productRatePlanCharges: [
    {
      name: 'Environments',
      tiers: [{ endingUnit: 10 }],
    },
    {
      name: 'Roles',
      tiers: [{ endingUnit: 10 }],
    },
    {
      name: 'Locales',
      tiers: [{ endingUnit: 10 }],
    },
    {
      name: 'Content types',
      tiers: [{ endingUnit: 10 }],
    },
    {
      name: 'Records',
      tiers: [{ endingUnit: 10 }],
    },
  ],
  name: 'Enterprise Space',
  roleSet: {
    name: 'lol',
    roles: ['Wizard'],
  },
});

const mockTransformedPlan = {
  current: false,
  disabled: false,
  includedResources: mockPlan.productRatePlanCharges.map(({ name, tiers }) => ({
    type: name,
    number: tiers[0].endingUnit,
  })),
  isFree: true,
  ...mockPlan,
};

jest.mock('../shared/utils', () => ({
  getIncludedResources: jest.fn().mockReturnValue([]),
  FREE_SPACE_IDENTIFIER: 'free_space',
  transformSpaceRatePlans: jest.fn(),
  getHighestPlan: jest.fn(),
  SpaceResourceTypes: {
    Roles: 'Role',
  },
  getTooltip: jest.fn().mockReturnValue(null),
  getRolesTooltip: jest.fn().mockReturnValue(null),
  getRecommendedPlan: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getSpaceRatePlans: jest.fn(),
  getSubscriptionPlans: jest.fn().mockResolvedValue({ items: [] }),
  calculateTotalPrice: jest.fn().mockReturnValue(0),
}));

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((type) => {
      if (type === 'free_space') {
        return mockFreeSpaceResource;
      }
    }),
    getAll: jest.fn().mockResolvedValue([]),
  };

  return () => service;
});

describe('ChangeOnDemandWizard', () => {
  beforeEach(() => {
    getSpaceRatePlans.mockResolvedValue([mockPlan]);
    transformSpaceRatePlans.mockReturnValue([mockTransformedPlan]);
  });

  it('should show the loading spinner initially', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should fetch the org free space resource, subscription plans, and space rate plans for the current space initially', () => {});

  it('should show a loading spinner while fetching the initial data', () => {});

  it('should show the SpacePlanSelector initially', () => {});

  it('should go to the confirmation screen once a space plan is selected', () => {});

  it('should call onProcessing with true when the change is confirmed', () => {});

  it('should call changeSpacePlan with the current space and new plan, and call onClose when successful', () => {});

  it('should not call onClose if changeSpacePlan rejects', () => {});
});

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      organization: mockOrganization,
      space: mockSpace,
      onClose: () => {},
      onProcessing: () => {},
    },
    custom
  );

  render(<ChangeOnDemandWizard {...props} />);

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));
  }
}
