import { getSpaces } from 'services/TokenStore';

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
 * into a map puts each plan in their own key
 *
 * spacePlans will be an array of plans sorted alphabetically by their space’s name
 *
 * @param plans - array of plans
 * @returns a map with basePlan, addOnPlan, and spacePlans
 */
export async function findAllPlans(plans: AnyPlan[]): Promise<AllPlans> {
  // spaces that current user has access to
  const accessibleSpaces = await getSpaces();

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
      const [name1, name2] = [plan1, plan2].map((plan) => plan.space.name);
      return name1.localeCompare(name2);
    })
    .map((spacePlan) => {
      // add to the spacePlan if they are accessible
      spacePlan.space.isAccessible = !!accessibleSpaces.find(
        (space) => space.sys.id === spacePlan.space.sys.id
      );

      // add them 0 price if they don't have one yet
      if (!spacePlan.price) {
        spacePlan.price = 0;
      }

      return spacePlan;
    });

  return reducedPlans;
}
