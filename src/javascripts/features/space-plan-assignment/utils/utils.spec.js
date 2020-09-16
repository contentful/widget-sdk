import * as utils from './utils';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockRatePlanCharges = [
  Fake.RatePlanCharge('Roles', 4),
  Fake.RatePlanCharge('Content types', 48),
  Fake.RatePlanCharge('Locales', 10),
  Fake.RatePlanCharge('Environments', 5),
  Fake.RatePlanCharge('Records', 50000),
];
const mockPlanLarge = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
});
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
});
