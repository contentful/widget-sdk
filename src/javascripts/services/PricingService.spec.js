import { when } from 'jest-when';
import * as Fake from 'test/helpers/fakeFactory';
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = Fake.Organization();
const mockSpace = Fake.Space();

// TODO: These should be moved somewhere more "shared"
import { FULFILLMENT_STATUSES, createResourcesForPlan } from 'app/SpaceWizards/__tests__/helpers';
import { mediumSpace, largeSpace } from 'app/SpaceWizards/__tests__/fixtures/plans';

import * as PricingService from './PricingService';

import * as spaceContext from 'classes/spaceContext';
import createResourceService from './ResourceService';

jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
  resources: createResourceService(),
}));

// Space rate plans are quite similar to product rate plans, except the key name is a little different
const mockCurrentSpaceSubscriptionPlan = Object.assign({}, mediumSpace, {
  ratePlanCharges: mediumSpace.productRatePlanCharges,
});

mockEndpoint.mockRejectedValue();

describe('PricingService', () => {
  beforeEach(() => {
    when(mockEndpoint)
      .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
      .mockResolvedValue({ items: [mediumSpace, largeSpace] })
      .calledWith(expect.objectContaining({ path: ['plans'] }))
      .mockResolvedValue({ items: [mockCurrentSpaceSubscriptionPlan] })
      .calledWith(expect.objectContaining({ path: ['resources'] }))
      .mockResolvedValue({ items: createResourcesForPlan(mockCurrentSpaceSubscriptionPlan) });
  });

  describe('recommendedSpacePlan', () => {
    it('should return null if all of the current resource usage is below the warning threshold', async () => {
      const resources = createResourcesForPlan(largeSpace);

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['resources'] }))
        .mockResolvedValueOnce({
          items: resources,
        });

      expect(
        await PricingService.recommendedSpacePlan(mockOrganization.sys.id, mockSpace.sys.id)
      ).toBeNull();
    });

    it('should return null if there are no plans that have more limits than any of the current usage', async () => {
      const resources = createResourcesForPlan(largeSpace, {
        [PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE]: FULFILLMENT_STATUSES.REACHED,
      });

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['resources'] }))
        .mockResolvedValueOnce({
          items: resources,
        });

      expect(
        await PricingService.recommendedSpacePlan(mockOrganization.sys.id, mockSpace.sys.id)
      ).toBeNull();
    });

    it('should return null if all possible space plans are unavailable', async () => {
      const resources = createResourcesForPlan(mediumSpace, {
        [PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE]: FULFILLMENT_STATUSES.REACHED,
      });
      const unavailableLarge = Object.assign({}, largeSpace, {
        unavailabilityReasons: [{ type: 'something' }],
      });

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
        .mockResolvedValueOnce({ items: [mediumSpace, unavailableLarge] })
        .calledWith(expect.objectContaining({ path: ['resources'] }))
        .mockResolvedValueOnce({
          items: resources,
        });

      expect(
        await PricingService.recommendedSpacePlan(mockOrganization.sys.id, mockSpace.sys.id)
      ).toBeNull();
    });

    it('should return the first valid space plan', async () => {
      const resources = createResourcesForPlan(mediumSpace, {
        [PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE]: FULFILLMENT_STATUSES.REACHED,
      });

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['resources'] }))
        .mockResolvedValueOnce({
          items: resources,
        });

      expect(
        await PricingService.recommendedSpacePlan(mockOrganization.sys.id, mockSpace.sys.id)
      ).toBe(largeSpace);
    });
  });

  describe('nextSpacePlanForResource', () => {
    it('should return null if all possible space plans are unavailable', async () => {
      const resources = createResourcesForPlan(mediumSpace);
      const unavailableLarge = Object.assign({}, largeSpace, {
        unavailabilityReasons: [{ type: 'something' }],
      });

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['product_rate_plans'] }))
        .mockResolvedValueOnce({ items: [mediumSpace, unavailableLarge] })
        .calledWith(expect.objectContaining({ path: ['resources'] }))
        .mockResolvedValueOnce({
          items: resources,
        });

      expect(
        await PricingService.nextSpacePlanForResource(
          mockOrganization.sys.id,
          mockSpace.sys.id,
          PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD
        )
      ).toBeNull();
    });

    it('should return null if there are no space plans with more limits than the current usage', async () => {
      const resources = createResourcesForPlan(largeSpace, {
        [PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD]: FULFILLMENT_STATUSES.REACHED,
      });

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['resources'] }))
        .mockResolvedValueOnce({
          items: resources,
        });

      expect(
        await PricingService.nextSpacePlanForResource(
          mockOrganization.sys.id,
          mockSpace.sys.id,
          PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD
        )
      ).toBeNull();
    });

    it('should return null if there are no space plans that have higher limits than the current plan for the given resource type', async () => {
      const currentSpacePlan = Object.assign({}, largeSpace, {
        ratePlanCharges: largeSpace.productRatePlanCharges,
      });

      when(mockEndpoint)
        .calledWith(expect.objectContaining({ path: ['plans'] }))
        .mockResolvedValueOnce({ items: [currentSpacePlan] });

      expect(
        await PricingService.nextSpacePlanForResource(
          mockOrganization.sys.id,
          mockSpace.sys.id,
          PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD
        )
      ).toBeNull();
    });

    it('should return the first valid space plan with higher limits for the given resource type', async () => {
      expect(
        await PricingService.nextSpacePlanForResource(
          mockOrganization.sys.id,
          mockSpace.sys.id,
          PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD
        )
      ).toBe(largeSpace);
    });
  });

  describe('explanationReasonText', () => {
    it('should return null if no resources are near or reached their limit', () => {
      const resources = [
        Fake.SpaceResource(1, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
        Fake.SpaceResource(2, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
      ];

      expect(PricingService.recommendationReasonText(resources)).toBeNull();
    });

    it('should return copy when all given resources have reached their limit', () => {
      const resources = [
        Fake.SpaceResource(20, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
        Fake.SpaceResource(20, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
      ];

      expect(PricingService.recommendationReasonText(resources)).toBe(
        'you’ve reached the records and locales limits for your current space plan'
      );
    });

    it('should return copy when all given resources are near their limit', () => {
      const resources = [
        Fake.SpaceResource(19, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
        Fake.SpaceResource(19, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
      ];

      expect(PricingService.recommendationReasonText(resources)).toBe(
        'you’re near the records and locales limits for your current space plan'
      );
    });

    it('should return copy when some resources are near and some have reached their limit', () => {
      const resources = [
        Fake.SpaceResource(19, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
        Fake.SpaceResource(20, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
      ];

      expect(PricingService.recommendationReasonText(resources)).toBe(
        'you’ve reached the locales and are near the records limits for your current space plan'
      );
    });

    it('should only consider certain "recommendable" resources when creating the copy', () => {
      const resources = [
        Fake.SpaceResource(20, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
        Fake.SpaceResource(20, 20, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
        Fake.SpaceResource(19, 20, 'role'),
        Fake.SpaceResource(19, 20, 'something_else'),
      ];

      expect(PricingService.recommendationReasonText(resources)).toBe(
        'you’ve reached the records and locales limits for your current space plan'
      );
    });
  });
});
