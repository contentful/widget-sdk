import { updateSpacePlan } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { track } from 'analytics/Analytics';

export async function changeSpacePlanAssignment(orgId, spaceId, newPlan, oldPlan, freePlan) {
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
      current_plan_id: oldPlan ? oldPlan.sys.id : freePlan.sys.id,
      current_plan_name: oldPlan ? oldPlan.name : freePlan.name,
      new_plan_id: updatedPlan.sys.id,
      new_plan_name: updatedPlan.name,
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
