import React from 'react';
import { render, screen, wait } from '@testing-library/react';
import {
  getBasePlan,
  getSpaceRatePlans,
  isEnterprisePlan,
} from 'account/pricing/PricingDataProvider';
import * as modalDialog from 'ng/modalDialog';
import Wizard from './Wizard';

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
}));

describe('Wizard', () => {
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

  it('should trigger the modalDialog if the base plan is not enterprise', async () => {
    isEnterprisePlan.mockReturnValueOnce(false);

    const onClose = jest.fn();

    await build({ onClose });

    expect(onClose).toBeCalled();
    expect(modalDialog.open).toBeCalledWith({
      title: 'Create new space',
      template: '<cf-space-wizard class="modal-background"></cf-space-wizard>',
      backgroundClose: false,
      persistOnNavigation: true,
      scopeData: {
        action: 'create',
        organization: {
          sys: mockOrganization.sys,
          name: mockOrganization.name,
          isBillable: mockOrganization.isBillable,
        },
      },
    });
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

  render(<Wizard {...props} />);

  if (shouldWait) {
    await wait();
  }
}
