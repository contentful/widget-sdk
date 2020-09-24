import * as utils from './utils';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockRatePlanCharges = [
  Fake.RatePlanCharge('Environments', 5),
  Fake.RatePlanCharge('Roles', 4),
  Fake.RatePlanCharge('Locales', 10),
  Fake.RatePlanCharge('Content types', 48),
  Fake.RatePlanCharge('Records', 50000),
];
const mockPlanMedium1 = Fake.Plan({
  name: 'Medium',
  ratePlanCharges: mockRatePlanCharges,
});
const mockPlanMedium2 = Fake.Plan({
  name: 'Medium',
  ratePlanCharges: mockRatePlanCharges,
});

const mockPlanMediumCustom = Fake.Plan({
  name: 'Medium',
  ratePlanCharges: [
    Fake.RatePlanCharge('Environments', 5),
    Fake.RatePlanCharge('Roles', 8),
    Fake.RatePlanCharge('Locales', 10),
    Fake.RatePlanCharge('Content types', 400),
    Fake.RatePlanCharge('Records', 50000),
  ],
});
const mockPlanLarge = Fake.Plan({
  name: 'Large',
  ratePlanCharges: [
    Fake.RatePlanCharge('Environments', 5),
    Fake.RatePlanCharge('Roles', 4),
    Fake.RatePlanCharge('Locales', 10),
    Fake.RatePlanCharge('Content types', 48),
    Fake.RatePlanCharge('Records', 50000),
  ],
});
const mockPlanLargeCustom = Fake.Plan({
  name: 'Large',
  ratePlanCharges: [
    Fake.RatePlanCharge('Environments', 5),
    Fake.RatePlanCharge('Roles', 4),
    Fake.RatePlanCharge('Locales', 10),
    Fake.RatePlanCharge('Content types', 4000),
    Fake.RatePlanCharge('Records', 50000),
  ],
});
const mockPlanContent = Fake.Plan({
  name: 'Content 3x',
  ratePlanCharges: [
    Fake.RatePlanCharge('Environments', 30),
    Fake.RatePlanCharge('Roles', 20),
    Fake.RatePlanCharge('Locales', 150),
    Fake.RatePlanCharge('Content types', 400),
    Fake.RatePlanCharge('Records', 3000000),
  ],
});

const mockPlans = [
  mockPlanMedium1,
  mockPlanMedium2,
  mockPlanLarge,
  mockPlanLargeCustom,
  mockPlanContent,
];

const mockGroupedPlans = {
  Medium_5_4_10_48_50000: [mockPlanMedium1, mockPlanMedium2],
  Large_5_4_10_4000_50000: [mockPlanLargeCustom],
  Large_5_4_10_48_50000: [mockPlanLarge],
  'Content 3x_30_20_150_400_3000000': [mockPlanContent],
};

const mockSpaceResourcesUnderLimits = {
  role: Fake.SpaceResource(2, 5, 'role'),
  environment: Fake.SpaceResource(0, 6, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  content_type: Fake.SpaceResource(25, 48, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 50000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 10, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

const mockSpaceResourcesEnvEqualToLimit = {
  ...mockSpaceResourcesUnderLimits,
  environment: Fake.SpaceResource(5, 6, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
};

const mockSpaceResourcesRolesOverLimit = {
  ...mockSpaceResourcesUnderLimits,
  role: Fake.SpaceResource(7, 5, 'role'),
};

const mockSpaceResourcesRecordsOverLimit = {
  ...mockSpaceResourcesUnderLimits,
  record: Fake.SpaceResource(50001, 50000, 'record'),
};

describe('Space Plan Assignment utils', () => {
  describe('#canPlanBeAssigned', () => {
    it('should return true if all space usages are lower or equal to the plan limits', () => {
      expect(utils.canPlanBeAssigned(mockPlanLarge, mockSpaceResourcesUnderLimits)).toBe(true);
      expect(utils.canPlanBeAssigned(mockPlanLarge, mockSpaceResourcesEnvEqualToLimit)).toBe(true);
    });

    it('should return false if at least one of the space usages are higher than the plan limits', () => {
      expect(utils.canPlanBeAssigned(mockPlanLarge, mockSpaceResourcesRecordsOverLimit)).toBe(
        false
      );
    });

    it('should ignore roles over the limit', () => {
      expect(utils.canPlanBeAssigned(mockPlanLarge, mockSpaceResourcesRolesOverLimit)).toBe(true);
    });
  });

  describe('#groupPlans', () => {
    it('should group custom plans separate', () => {
      expect(utils.groupPlans(mockPlans)).toEqual(mockGroupedPlans);
    });
  });

  describe('#buildPlanKey', () => {
    it('should key based on name and ratePlanCharges', () => {
      expect(utils.buildPlanKey(mockPlanMedium1.name, mockRatePlanCharges)).toEqual(
        'Medium_5_4_10_48_50000'
      );
    });
  });

  describe('#orderPlanKeys', () => {
    const mockDefaultRatePlanKeys = [
      'Medium_5_4_10_48_50000',
      'Large_5_4_10_48_50000',
      'Content 3x_30_20_150_400_3000000',
    ];

    it('should maintain order if no plans are custom', () => {
      const mockGroupedPlans = {
        Medium_5_4_10_48_50000: [mockPlanMedium1, mockPlanMedium2],
        Large_5_4_10_48_50000: [mockPlanLarge],
        'Content 3x_30_20_150_400_3000000': [mockPlanContent],
      };
      expect(utils.orderPlanKeys(mockGroupedPlans, mockDefaultRatePlanKeys)).toEqual([
        'Medium_5_4_10_48_50000',
        'Large_5_4_10_48_50000',
        'Content 3x_30_20_150_400_3000000',
      ]);
    });

    it('should order custom plan before any default plans ', () => {
      const mockGroupedPlans = {
        Medium_5_4_10_48_50000: [mockPlanMedium1, mockPlanMedium2],
        Large_5_4_10_4000_50000: [mockPlanLargeCustom],
        Large_5_4_10_48_50000: [mockPlanLarge],
      };
      expect(utils.orderPlanKeys(mockGroupedPlans, mockDefaultRatePlanKeys)).toEqual([
        'Medium_5_4_10_48_50000',
        'Large_5_4_10_48_50000',
        'Large_5_4_10_4000_50000',
      ]);
    });

    it('should order custom plan after default plan of same price but before more expensive default plans', () => {
      const mockGroupedPlans = {
        Medium_5_8_10_400_50000: [mockPlanMediumCustom],
        Medium_5_4_10_48_50000: [mockPlanMedium1, mockPlanMedium2],
        Large_5_4_10_48_50000: [mockPlanLarge],
      };
      expect(utils.orderPlanKeys(mockGroupedPlans, mockDefaultRatePlanKeys)).toEqual([
        'Medium_5_4_10_48_50000',
        'Medium_5_8_10_400_50000',
        'Large_5_4_10_48_50000',
      ]);
    });

    it('should order both custom plans after default plan', () => {
      const mockGroupedPlans = {
        Medium_5_4_10_48_50000: [mockPlanMedium1, mockPlanMedium2],
        Large_5_40_10_4000_50000: [mockPlanLargeCustom],
        Large_5_4_10_4000_50000: [mockPlanLargeCustom],
        Large_5_4_10_48_50000: [mockPlanLarge],
      };
      expect(utils.orderPlanKeys(mockGroupedPlans, mockDefaultRatePlanKeys)).toEqual([
        'Medium_5_4_10_48_50000',
        'Large_5_4_10_48_50000',
        'Large_5_40_10_4000_50000',
        'Large_5_4_10_4000_50000',
      ]);
    });
  });
});
