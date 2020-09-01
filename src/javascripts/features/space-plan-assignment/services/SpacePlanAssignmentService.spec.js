import { changeSpacePlanAssignment } from './SpacePlanAssignmentService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { updateSpacePlan } from 'account/pricing/PricingDataProvider';
import { mockEndpoint } from '__mocks__/data/EndpointFactory';
import * as fake from 'test/helpers/fakeFactory';

const orgId = 'orgid';
const spaceId = 'spaceid';
const oldPlan = fake.Plan({ gatekeeperKey: spaceId });
const newPlan = fake.Plan({ gatekeeperKey: null });

jest.mock('account/pricing/PricingDataProvider', () => ({
  updateSpacePlan: jest.fn(async () => {}),
}));

describe('SpacePlanAssignmentService', () => {
  it('should assign a space to a plan', async () => {
    await changeSpacePlanAssignment(orgId, spaceId, newPlan);

    expect(createOrganizationEndpoint).toHaveBeenCalledWith(orgId);
    expect(updateSpacePlan).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({
        ...newPlan,
        gatekeeperKey: spaceId,
      })
    );
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
});
