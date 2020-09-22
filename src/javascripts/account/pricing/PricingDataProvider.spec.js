import { getAllSpaces, getUsersByIds } from 'access_control/OrganizationMembershipRepository';
import * as PricingDataProvider from './PricingDataProvider';
import { getVariation } from 'LaunchDarkly';
import { getSpaces } from 'services/TokenStore';

const mockEnterpriseBasePlan = {
  items: [
    {
      productPlanType: 'base',
      customerType: 'Enterprise',
    },
    {
      productPlanType: 'free_space',
      name: 'Proof of concept',
    },
  ],
};
const mockEnterpriseBasePlanWithTrialSpace = {
  items: [
    {
      productPlanType: 'base',
      customerType: 'Enterprise',
    },
    {
      productPlanType: 'free_space',
      name: 'Trial Space',
    },
  ],
};
const mockHighDemandBasePlan = {
  items: [
    {
      productPlanType: 'base',
      customerType: 'High Demand Enterprise',
    },
    {
      productPlanType: 'free_space',
      name: 'Performance 1x',
    },
  ],
};
const mockSelfServiceBasePlan = {
  items: [
    {
      productPlanType: 'base',
      customerType: 'Self-service',
    },
    {
      productPlanType: 'free_space',
      name: 'Free',
    },
  ],
};
const mockSpacePlansData = {
  items: [
    { sys: { id: 'plan1' }, planType: 'space', gatekeeperKey: 'space1', name: 'Yellow' },
    { sys: { id: 'plan2' }, planType: 'space', gatekeeperKey: 'space2', name: 'Blue' },
    { sys: { id: 'plan3' }, planType: 'space', gatekeeperKey: 'space3', name: 'Green' },
    { sys: { id: 'plan4', planType: 'space', name: 'Gray' } },
  ],
};
const mockSpacesData = [
  { sys: { id: 'space1', createdBy: { sys: { id: 'user1' } } } },
  { sys: { id: 'space2', createdBy: { sys: { id: 'user2' } } } },
  { sys: { id: 'space3', createdBy: { sys: { id: 'user1' } } } },
  {
    sys: {
      id: 'free_space',
      createdBy: { sys: { id: 'free_space_user' } },
      createdAt: '2020-05-11T15:19:25Z',
    },
  },
];
const mockUsersData = [{ sys: { id: 'user1' }, email: 'user1@foo.com' }];
const mockTrialSpace = {
  trialPeriodEndsAt: '2020-10-10',
  sys: { id: 'free_space' },
};
const mockPOCSpace = { sys: { id: 'free_space' } };

const mockEndpoint = jest.fn();

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(),
  getUsersByIds: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
}));

describe('account/pricing/PricingDataProvider', () => {
  beforeEach(() => {
    getAllSpaces.mockResolvedValue(mockSpacesData);
    getUsersByIds.mockResolvedValue(mockUsersData);
    getVariation.mockResolvedValue(false);
  });
  describe('#getPlansWithSpaces()', () => {
    beforeEach(function () {
      mockEndpoint
        .mockResolvedValueOnce(mockSelfServiceBasePlan)
        .mockResolvedValueOnce(mockSpacePlansData)
        .mockResolvedValue(mockSpacesData);
    });

    it('parses response data and sets spaces and users', async function () {
      const plans = await PricingDataProvider.getPlansWithSpaces(mockEndpoint);
      expect(plans.items).toHaveLength(5);
      expectSpacePlan(plans.items[0], 'plan1', 'space1', 'user1@foo.com');
      expectSpacePlan(plans.items[1], 'plan2', 'space2', null);
      expectSpacePlan(plans.items[2], 'plan3', 'space3', 'user1@foo.com');
      expectSpacePlan(plans.items[3], 'plan4', null, null);
      expectSpacePlan(plans.items[4], 'free-space-plan-1', 'free_space', null);
    });

    it('fetches all spaces', async function () {
      await PricingDataProvider.getPlansWithSpaces(mockEndpoint);
      expect(getAllSpaces).toHaveBeenCalled();
    });

    it('gets unique user ids by id', async function () {
      await PricingDataProvider.getPlansWithSpaces(mockEndpoint);

      expect(getUsersByIds).toHaveBeenCalledWith(mockEndpoint, [
        'user1',
        'user2',
        'free_space_user',
      ]);
    });

    it('names free plans correctly for different customer types', async () => {
      await expectFreePlanName('Performance 1x', mockHighDemandBasePlan);
      await expectFreePlanName('Proof of concept', mockEnterpriseBasePlan);
      await expectFreePlanName('Free', mockSelfServiceBasePlan);
    });

    it('names free plans correctly for different customer types when feature flag is on', async () => {
      getVariation.mockResolvedValueOnce(true);
      getSpaces.mockResolvedValue([mockTrialSpace]);

      await expectFreePlanName('Trial Space', mockEnterpriseBasePlanWithTrialSpace);
      await expectFreePlanName('Free', mockSelfServiceBasePlan);
      await expectFreePlanName('Performance 1x', mockHighDemandBasePlan);
    });

    it('identifies the PoC space and name it correctly', async () => {
      getVariation.mockResolvedValueOnce(true);
      getSpaces.mockResolvedValue([mockPOCSpace]);

      await expectFreePlanName('Proof of Concept', mockEnterpriseBasePlanWithTrialSpace);
    });

    it('uses the createdAt date to differenciate the PoC and Trial Space if the space is not accessible', async () => {
      getVariation.mockResolvedValueOnce(true);
      getSpaces.mockResolvedValueOnce([]); // the trial info not available via TokenStore

      await expectFreePlanName('Proof of Concept', mockEnterpriseBasePlanWithTrialSpace);
    });
  });

  describe('#isSelfServicePlan', () => {
    it('should return true for customer type "Self-service"', function () {
      const plan = {
        customerType: 'Self-service',
      };

      expect(PricingDataProvider.isSelfServicePlan(plan)).toBe(true);
    });
  });

  describe('#isEnterprisePlan', () => {
    it('should return true for customer type "Enterprise"', function () {
      const plan = {
        customerType: 'Enterprise',
      };

      expect(PricingDataProvider.isEnterprisePlan(plan)).toBe(true);
    });

    it('should return true for customer type "Enterprise Trial"', function () {
      const plan = {
        customerType: 'Enterprise Trial',
      };

      expect(PricingDataProvider.isEnterprisePlan(plan)).toBe(true);
    });
  });

  describe('#isHighDemandEnterprisePlan', () => {
    it('should return true for customer type "Enterprise High Demand"', function () {
      const plan = {
        customerType: 'Enterprise High Demand',
      };

      expect(PricingDataProvider.isHighDemandEnterprisePlan(plan)).toBe(true);
    });

    it('should return false for customer type "Enterprise"', function () {
      const plan = {
        customerType: 'Enterprise',
      };

      expect(PricingDataProvider.isHighDemandEnterprisePlan(plan)).toBe(false);
    });

    it('should return false for customer type "Enterprise Trial"', function () {
      const plan = {
        customerType: 'Enterprise Trial',
      };

      expect(PricingDataProvider.isHighDemandEnterprisePlan(plan)).toBe(false);
    });
  });
});

function expectSpacePlan(plan, id, spaceId, email) {
  expect(plan.sys.id).toBe(id);
  if (spaceId) {
    expect(plan.space).toBeDefined();
    expect(plan.space.sys.id).toBe(spaceId);
    if (email) {
      expect(plan.space.sys.createdBy).toBeDefined();
      expect(plan.space.sys.createdBy.email).toBe(email);
    } else {
      expect(plan.space.sys.createdBy).toBeUndefined();
    }
  } else {
    expect(plan.space).toBeUndefined();
  }
}

async function expectFreePlanName(name, baseRatePlan) {
  mockEndpoint.mockReset();
  mockEndpoint.mockResolvedValueOnce(baseRatePlan).mockResolvedValueOnce(mockSpacePlansData);
  const { items: plans } = await PricingDataProvider.getPlansWithSpaces(mockEndpoint);
  const free = plans.find((plan) => plan.gatekeeperKey === 'free_space');
  expect(free.name).toBe(name);
}
