import React from 'react';
import { render, screen, wait, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeOnDemandWizard from './ChangeOnDemandWizard';
import * as Fake from 'test/helpers/fakeFactory';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
} from 'account/pricing/PricingDataProvider';
import { transformSpaceRatePlans, getRecommendedPlan, changeSpacePlan } from '../shared/utils';
import createResourceService from 'services/ResourceService';
import cleanupNotifications from 'test/helpers/cleanupNotifications';

const mockOrganization = Fake.Organization();
const mockSpace = Fake.Space();

const mockResources = [
  Fake.SpaceResource(3, 3, 'environment'),
  Fake.SpaceResource(2, 3, 'role'),
  Fake.SpaceResource(1, 3, 'locale'),
  Fake.SpaceResource(2, 3, 'content_type'),
  Fake.SpaceResource(1, 3, 'record'),
];

const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');

const mockPlans = [
  Fake.Plan({
    productPlanType: 'free_space',
    productRatePlanCharges: [
      {
        name: 'Environments',
        tiers: [{ endingUnit: 3 }],
      },
      {
        name: 'Roles',
        tiers: [{ endingUnit: 3 }],
      },
      {
        name: 'Locales',
        tiers: [{ endingUnit: 3 }],
      },
      {
        name: 'Content types',
        tiers: [{ endingUnit: 3 }],
      },
      {
        name: 'Records',
        tiers: [{ endingUnit: 3 }],
      },
    ],
    unavailabilityReasons: [{ type: 'currentPlan' }],
    name: 'A free space',
    roleSet: {
      name: 'lol',
      roles: ['Wizard'],
    },
  }),
  Fake.Plan({
    productPlanType: 'another_space_plan',
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
    unavailabilityReasons: [],
    name: 'Not free plan',
    roleSet: {
      name: 'lmao',
      roles: ['Witch', 'The Masked One'],
    },
  }),
];

const mockTransformedPlans = mockPlans.map((plan) => ({
  current: plan.unavailabilityReasons.find(({ type }) => type === 'currentPlan'),
  disabled: plan.unavailabilityReasons.length > 0,
  includedResources: plan.productRatePlanCharges.map(({ name, tiers }) => ({
    type: name,
    number: tiers[0].endingUnit,
  })),
  isFree: plan.productPlanType === 'free_space',
  ...plan,
}));

jest.mock('../shared/utils', () => ({
  changeSpacePlan: jest.fn(),
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
    getAll: jest.fn(async () => {
      return mockResources;
    }),
  };

  return () => service;
});

jest.useFakeTimers();

describe('ChangeOnDemandWizard', () => {
  beforeEach(() => {
    getSpaceRatePlans.mockResolvedValue(mockPlans);
    transformSpaceRatePlans.mockReturnValue(mockTransformedPlans);
  });

  afterEach(cleanupNotifications);

  it('should show the loading spinner initially', async () => {
    build({}, false);

    expect(screen.queryByTestId('wizard-loader')).toBeVisible();

    await waitForElementToBeRemoved(() => screen.queryByTestId('wizard-loader'));

    expect(screen.queryByTestId('wizard-loader')).toBeNull();
  });

  it('should fetch all the data initially', async () => {
    const service = createResourceService();
    await build();

    expect(service.get).toBeCalledWith('free_space');
    expect(service.getAll).toBeCalled();
    expect(getSubscriptionPlans).toBeCalledWith(expect.any(Function));
    expect(getSpaceRatePlans).toBeCalledWith(expect.any(Function), mockSpace.sys.id);

    expect(transformSpaceRatePlans).toBeCalledWith({
      organization: mockOrganization,
      spaceRatePlans: mockPlans,
      freeSpaceResource: mockFreeSpaceResource,
    });
    expect(calculateTotalPrice).toBeCalled();
  });

  it('should show the SpacePlanSelector initially and disable the confirmation tab', async () => {
    await build();

    expect(screen.getByTestId('space-plan-selector')).toBeVisible();
    expect(screen.getByTestId('confirmation-tab')).toHaveAttribute('aria-disabled', 'true');
  });

  it('should go to the confirmation screen once a space plan is selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);

    expect(screen.getByTestId('confirmation-tab')).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('confirmation-screen')).toBeVisible();
  });

  it('should recommend the bigger plan if getRecommendedPlan is true', async () => {
    getRecommendedPlan.mockReturnValueOnce(mockPlans[1]);

    await build();

    expect(screen.getAllByTestId('space-plan-item')[1]).toHaveAttribute(
      'class',
      expect.stringMatching('recommendedPlan')
    );
  });

  it('shouid not recommend the bigger plan is getRecommendedPlan is false', async () => {
    await build();

    expect(screen.getAllByTestId('space-plan-item')[1]).not.toHaveAttribute(
      'class',
      expect.stringMatching('recommendedPlan')
    );
  });

  it('should call onProcessing with true when the change is confirmed', async () => {
    const onProcessing = jest.fn();
    await build({ onProcessing });

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    expect(onProcessing).toBeCalledWith(true);

    await wait();
  });

  it('should hide the close button while the space plan is being changed', async () => {
    await build();

    expect(screen.getByTestId('close-icon')).toBeVisible();

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    expect(screen.queryByTestId('close-icon')).toBeNull();

    await wait();
  });

  it('should call changeSpacePlan with the current space and new plan, and call onClose when successful', async () => {
    const onClose = jest.fn();
    await build({ onClose });

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    expect(changeSpacePlan).toBeCalledWith({ space: mockSpace, plan: mockTransformedPlans[1] });

    await wait();

    expect(onClose).toBeCalledWith(mockTransformedPlans[1]);
  });

  it('should not call onClose and should trigger a notification if changeSpacePlan rejects', async () => {
    changeSpacePlan.mockRejectedValueOnce(new Error());

    const onClose = jest.fn();
    await build({ onClose });

    userEvent.click(screen.getAllByTestId('space-plan-item')[1]);
    userEvent.click(screen.getByTestId('confirm-button'));

    await wait();

    expect(onClose).not.toBeCalled();
    expect(await screen.findByTestId('cf-ui-notification')).toHaveAttribute('data-intent', 'error');
  });
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
