import type { BasePlan, AddOnPlan } from 'features/pricing-entities';
import type { SpacePlan } from '../types';

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
 * @returns a map with basePlan, addOnPlan, and spacePlans
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
