import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { getSpacePlans, getAllProductRatePlans } from 'features/pricing-entities';
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';
import { sortBy } from 'lodash';

export const CREATION_FLOW_TYPE = 'creation';

export function getPlansData(orgId: string) {
  return async function getPlansDataInner() {
    const DEFAULT_ROLE_SET = { roles: ['Editor'] };
    const orgEndpoint = createOrganizationEndpoint(orgId);
    const orgResources = createResourceService(orgEndpoint);

    const [plans, productRatePlans, freeSpaceResource] = await Promise.all([
      getSpacePlans(orgEndpoint),
      getAllProductRatePlans(orgEndpoint),
      orgResources.get(FREE_SPACE_IDENTIFIER),
    ]);

    const freeSpaceRatePlan = productRatePlans.find(
      (plan) => plan.productPlanType === FREE_SPACE_IDENTIFIER
    );

    // TODO(mire): remove the temporary solution when a new plan is mapped
    if (freeSpaceRatePlan?.name === 'Unassigned') {
      freeSpaceRatePlan.name = 'Trial Space';
    }

    // filter plans that already have a space assigned (gatekeeperKey)
    const availablePlans = plans.filter((plan) => !plan.gatekeeperKey);

    // enhence plans with roleSet in order to display tooltip text for Roles
    const enhancedPlans = availablePlans.map((plan) => {
      return {
        ...plan,
        roleSet:
          productRatePlans.find((ratePlan) => ratePlan.name === plan.name)?.roleSet ??
          DEFAULT_ROLE_SET,
      };
    });

    return {
      plans: sortBy(enhancedPlans, 'price'),
      productRatePlans,
      freePlan: freeSpaceRatePlan,
      freeSpaceResource,
    };
  };
}
