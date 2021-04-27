import * as Fake from 'test/helpers/fakeFactory';

import { findAllPlans } from './plans';

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn().mockResolvedValue([]),
}));

const mockBasePlan = Fake.Plan({
  planType: 'base',
});
const mockAddOnPlan = Fake.Plan({
  planType: 'add_on',
});

const mockSpaceForPlanA = Fake.Space({ name: 'Space A', sys: { id: 'space_A' } });
const mockSpaceForPlanB = Fake.Space({ name: 'Space B', sys: { id: 'space_B' } });

const mockSpacePlanA = Fake.Plan({
  sys: { id: 'random_id_1' },
  name: 'random_plan_A',
  planType: 'free_space',
  space: mockSpaceForPlanA,
  price: 0,
});

const mockSpacePlanB = Fake.Plan({
  sys: { id: 'random_id_2' },
  name: 'random_plan_B',
  planType: 'space',
  space: mockSpaceForPlanB,
  price: 456,
});

describe('findAllPlans', () => {
  it('returns a map with undefined values when passed an empty array', async () => {
    const allPlans = await findAllPlans([]);

    expect(allPlans.basePlan).toBeUndefined();
    expect(allPlans.addOnPlan).toBeUndefined();
    expect(allPlans.spacePlans).toEqual([]);
  });

  it('separates an array of "plans" into a map with basePlan, addOnPlan, and spacePlans', async () => {
    const allPlans = await findAllPlans([
      mockBasePlan,
      mockAddOnPlan,
      mockSpacePlanA,
      mockSpacePlanB,
    ]);

    expect(allPlans.basePlan).toEqual(mockBasePlan);
    expect(allPlans.addOnPlan).toEqual(mockAddOnPlan);
    // checks if spacePlans is in alphabetical order
    expect(allPlans.spacePlans).toEqual([mockSpacePlanA, mockSpacePlanB]);
  });
});