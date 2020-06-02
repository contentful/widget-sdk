import React from 'react';
import { render, screen, wait } from '@testing-library/react';
import {
  getBasePlan,
  getSpaceRatePlans,
  isEnterprisePlan,
} from 'account/pricing/PricingDataProvider';
import SpaceWizardsWrapper from './SpaceWizardsWrapper';

const mockOrganization = {
  name: 'My org',
  isBillable: true,
  sys: {
    id: 'org_1234',
  },
};

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

const mockFreeSpaceRatePlan = {
  productPlanType: 'free_space',
  productRatePlanCharges: mockRatePlanCharges,
  name: 'Enterprise Space',
  roleSet: {
    name: 'lol',
    roles: ['Wizard'],
  },
  sys: {
    id: 'free_space_1234',
  },
};

jest.mock('services/ResourceService', () => {
  const service = {
    get: jest.fn((type) => {
      if (type === 'free_space') {
        return {
          usage: 1,
          limits: {
            maximum: 5,
          },
        };
      }
    }),
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

  it('should get the base plan and determine if the plan is enterprise if creating a space', async () => {
    await build();

    expect(getBasePlan).toBeCalled();
  });

  it('should show the loading spinner while the data is being fetched', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await wait();

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

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

async function build(custom, shouldWait = true) {
  const props = Object.assign(
    {
      isShown: true,
      onClose: () => {},
      organization: mockOrganization,
    },
    custom
  );

  render(<SpaceWizardsWrapper {...props} />);

  if (shouldWait) {
    await wait();
  }
}
