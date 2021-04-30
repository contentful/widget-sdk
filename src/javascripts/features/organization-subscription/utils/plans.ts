import type { BasePlan, AddOnPlan } from 'features/pricing-entities';
import type { SpacePlan } from '../types';

import {
  FREE,
  SELF_SERVICE,
  ENTERPRISE,
  ENTERPRISE_HIGH_DEMAND,
  PARTNER_PLATFORM_BASE_PLAN_NAME,
} from 'account/pricing/PricingDataProvider';

type AnyPlan = BasePlan | AddOnPlan | SpacePlan;

interface AllPlans {
  basePlan?: BasePlan;
  addOnPlan?: AddOnPlan;
  spacePlans: SpacePlan[];
}

/**
 * This function can be used to transform an array of subscription plans (base, add_on, and space)
 * into a map that puts each plan in their own key
 *
 * spacePlans will be an array of plans sorted alphabetically by their space’s name
 *
 * @param plans - array of plans
 * @param accessibleSpaces - array of spaces that current user has access to (use `getSpaces` from the TokenStore to get it)
 * @returns {AllPlans} a map with basePlan, addOnPlan, and spacePlans
 */
export function findAllPlans(
  plans: AnyPlan[],
  accessibleSpaces: { sys: { id: string } }[]
): AllPlans {
  const reducedPlans = plans.reduce(
    (acc, plan) => {
      switch (plan.planType) {
        case 'base':
          return { ...acc, basePlan: plan as BasePlan };
        case 'add_on':
          return { ...acc, addOnPlan: plan as AddOnPlan };
        case 'space':
        case 'free_space':
          return { ...acc, spacePlans: [...acc['spacePlans'], plan as SpacePlan] };
        default:
          return acc;
      }
    },
    { spacePlans: [] } as AllPlans
  );

  // sort spacePlans alphabetically
  reducedPlans.spacePlans
    .sort((plan1, plan2) => {
      const [name1, name2] = [plan1, plan2].map((plan) => {
        // It is possible that some spacePlans won't have the property 'space'
        return plan.space?.name ?? '';
      });
      return name1.localeCompare(name2);
    })
    .map((spacePlan) => {
      // add to the spacePlan if they are accessible
      if (spacePlan.space) {
        spacePlan.space.isAccessible = !!accessibleSpaces.find(
          (space) => space.sys.id === spacePlan.space?.sys.id
        );
      }

      // add them 0 price if they don't have one yet
      if (!spacePlan.price) {
        spacePlan.price = 0;
      }

      return spacePlan;
    });

  return reducedPlans;
}

// List of tiers that already have content entries in Contentful
// and can already use the rebranded version of our SubscriptionPage
const basePlansWithContent = [
  FREE,
  SELF_SERVICE,
  ENTERPRISE,
  ENTERPRISE_HIGH_DEMAND,
  PARTNER_PLATFORM_BASE_PLAN_NAME,
];

/**
 * This function checks if a given basePlan already have content in Contentful for its BasePlanCard
 * the content lives in Contentful ProdDev organization and in 'Webapp content' space
 *
 * @param basePlan - a plan that has `planType: 'base'`
 */
export function hasContentForBasePlan(basePlan: BasePlan): boolean {
  return (
    basePlansWithContent.includes(basePlan.customerType) ||
    basePlansWithContent.includes(basePlan.name)
  );
}
