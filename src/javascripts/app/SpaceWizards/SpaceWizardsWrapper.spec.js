import React from 'react';
import { render, screen, wait } from '@testing-library/react';
import {
  getBasePlan,
  getSpaceRatePlans,
  isEnterprisePlan,
} from 'account/pricing/PricingDataProvider';
import SpaceWizardsWrapper from './SpaceWizardsWrapper';
import * as Fake from 'test/helpers/fakeFactory';

const mockOrganization = Fake.Organization({
  isBillable: true,
});
const mockSpace = Fake.Space();

const mockRatePlanCharges = [
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
];

const mockFreeSpaceRatePlan = Fake.Plan({
  productPlanType: 'free_space',
  productRatePlanCharges: mockRatePlanCharges,
  unavailabilityReasons: [],
  name: 'Enterprise Space',
  roleSet: {
    name: 'lol',
    roles: ['Wizard'],
  },
});

const mockCurrentSpaceRatePlan = Object.assign({}, mockFreeSpaceRatePlan, {
  unavailabilityReasons: [
    {
      type: 'currentPlan',
    },
  ],
});

const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');
const mockSpaceResources = [Fake.SpaceResource(1, 3, 'environment')];

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((type) => {
      if (type === 'free_space') {
        return mockFreeSpaceResource;
      }
    }),
    getAll: jest.fn(() => mockSpaceResources),
  };

  return () => service;
});

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn().mockResolvedValue([]),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn().mockReturnValue(true),
  getBasePlan: jest.fn().mockResolvedValue({}),
  getSpaceRatePlans: jest.fn(),
  isHighDemandEnterprisePlan: jest.fn(),
  getSubscriptionPlans: jest.fn().mockResolvedValue({ items: [] }),
  calculateTotalPrice: jest.fn(),
}));

describe('SpaceWizardsWrapper', () => {
  beforeEach(() => {
    getSpaceRatePlans.mockResolvedValue([mockFreeSpaceRatePlan]);
  });

  it('should always get the base plan and determine if the plan is enterprise', async () => {
    await build();

    expect(getBasePlan).toBeCalled();
    expect(isEnterprisePlan).toBeCalled();
  });

  it('should show the loading spinner while the data is being fetched', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await wait();

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  describe('space creation', () => {
    it('should show the POC space creation wizard if the base plan is enterprise', async () => {
      await build();

      expect(screen.queryByTestId('enterprise-wizard-contents')).toBeVisible();
    });

    it('should show the on-demand space creation wizard if the base plan is not enterprise', async () => {
      isEnterprisePlan.mockReturnValueOnce(false);

      await build();

      expect(screen.queryByTestId('create-on-demand-wizard-contents')).toBeVisible();
    });
  });

  describe('space plan change', () => {
    beforeEach(() => {
      getSpaceRatePlans.mockClear().mockResolvedValue([mockCurrentSpaceRatePlan]);
    });

    it('should show the on-demand space change wizard if a space is provided', async () => {
      await build({ space: mockSpace });

      expect(screen.queryByTestId('change-on-demand-wizard-contents')).toBeVisible();
    });
  });
});

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      isShown: true,
      onClose: () => {},
      organization: mockOrganization,
      space: null,
    },
    custom
  );

  render(<SpaceWizardsWrapper {...props} />);

  if (shouldWait) {
    await wait();
  }
}
