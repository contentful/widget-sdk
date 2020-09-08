import { updateSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { track } from 'analytics/Analytics';

export async function changeSpacePlanAssignment(orgId, spaceId, newPlan, oldPlan) {
  const endpoint = createOrganizationEndpoint(orgId);

  if (oldPlan) {
    // unassign space from current plan
    const updatedOldPlan = { ...oldPlan, gatekeeperKey: null };
    await updateSpacePlan(endpoint, updatedOldPlan);
  }

  const updatedPlan = { ...newPlan, gatekeeperKey: spaceId };
  try {
    track('space_assignment:confirm', {
      space_id: spaceId,
      updated_plan_id: updatedPlan.sys.id,
      updated_plan_name: updatedPlan.name,
      // TODO: update event in a separate task as soon as it's clarified with data team
    });
    return await updateSpacePlan(endpoint, updatedPlan);
  } catch (err) {
    if (oldPlan) {
      // roll back to old assignment
      await updateSpacePlan(endpoint, oldPlan);
    }
    // throw so that we can always display a meaningful message
    throw err;
  }
}
