import { changeSpacePlanAssignment } from './SpacePlanAssignmentService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { updateSpacePlan } from 'features/pricing-entities';
import { mockOrganizationEndpoint as mockEndpoint } from '__mocks__/data/EndpointFactory';
import * as fake from 'test/helpers/fakeFactory';
import { track } from 'analytics/Analytics';

const orgId = 'orgid';
const spaceId = 'spaceid';
const oldPlan = fake.Plan({ gatekeeperKey: spaceId });
const newPlan = fake.Plan({ gatekeeperKey: null });
const freePlan = fake.Plan({ gatekeeperKey: null });

jest.mock('features/pricing-entities', () => ({
  updateSpacePlan: jest.fn(async () => {}),
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('SpacePlanAssignmentService', () => {
  it('should assign a space to a plan', async () => {
    await changeSpacePlanAssignment(orgId, spaceId, newPlan, freePlan);

    expect(createOrganizationEndpoint).toHaveBeenCalledWith(orgId);
    expect(updateSpacePlan).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({
        ...newPlan,
        gatekeeperKey: spaceId,
      })
    );
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'space_assignment:confirm', {
      space_id: spaceId,
      current_plan_id: freePlan.sys.id,
      current_plan_name: freePlan.name,
      new_plan_id: newPlan.sys.id,
      new_plan_name: newPlan.name,
    });
  });

  it('should swap spaces assigned to a plan', async () => {
    await changeSpacePlanAssignment(orgId, spaceId, newPlan, oldPlan);

    expect(updateSpacePlan).toHaveBeenNthCalledWith(
      1,
      mockEndpoint,
      expect.objectContaining({
        ...oldPlan,
        gatekeeperKey: null,
      })
    );
    expect(updateSpacePlan).toHaveBeenNthCalledWith(
      2,
      mockEndpoint,
      expect.objectContaining({
        ...newPlan,
        gatekeeperKey: spaceId,
      })
    );
  });

  it('should rolback the swapping in the event of an error', async () => {
    const error = new Error('Oppsie');
    updateSpacePlan.mockResolvedValueOnce({}).mockRejectedValueOnce(error);

    try {
      await changeSpacePlanAssignment(orgId, spaceId, newPlan, oldPlan);
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(updateSpacePlan).toHaveBeenNthCalledWith(
      1,
      mockEndpoint,
      expect.objectContaining({
        // unassign space from old plan
        ...oldPlan,
        gatekeeperKey: null,
      })
    );
    expect(updateSpacePlan).toHaveBeenNthCalledWith(
      2,
      mockEndpoint,
      expect.objectContaining({
        // try to assign space to new plan, and fail
        ...newPlan,
        gatekeeperKey: spaceId,
      })
    );
    expect(updateSpacePlan).toHaveBeenNthCalledWith(
      3,
      mockEndpoint,
      expect.objectContaining({
        // roll back to old plan
        ...oldPlan,
        gatekeeperKey: spaceId,
      })
    );
  });

  it('should track confirm when swap with old plan', async () => {
    await changeSpacePlanAssignment(orgId, spaceId, newPlan, oldPlan, freePlan);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'space_assignment:confirm', {
      space_id: spaceId,
      current_plan_id: oldPlan.sys.id,
      current_plan_name: oldPlan.name,
      new_plan_id: newPlan.sys.id,
      new_plan_name: newPlan.name,
    });
  });
});
