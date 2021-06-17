import * as Fake from 'test/helpers/fakeFactory';

import { findAllPlans } from './plans';

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn().mockResolvedValue([]),
}));

const mockBasePlan = Fake.Plan({
  planType: 'base',
});
const mockAddOnPlans = [
  Fake.Plan({
    planType: 'add_on',
  }),
];

const mockSpaceForPlanA = Fake.Space({ name: 'Space A', sys: { id: 'space_A' } });
const mockSpaceForPlanB = Fake.Space({ name: 'Space B', sys: { id: 'space_B' } });
const mockSpaceForPlanWithoutPrice = Fake.Space({ name: 'Space C', sys: { id: 'space_C' } });

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

const mockSpacePlanWithoutPrice = Fake.Plan({
  sys: { id: 'random_id_3' },
  name: 'random_plan_C',
  planType: 'space',
  space: mockSpaceForPlanWithoutPrice,
});

describe('findAllPlans', () => {
  it('returns a map with undefined values when passed an empty array as plans and an empty array as accessible spaces', () => {
    const allPlans = findAllPlans([], []);

    expect(allPlans.basePlan).toBeUndefined();
    expect(allPlans.addOnPlans).toEqual([]);
    expect(allPlans.spacePlans).toEqual([]);
  });

  it('separates an array of "plans" into a map with basePlan, addOnPlan, and spacePlans', () => {
    const allPlans = findAllPlans(
      [mockBasePlan, ...mockAddOnPlans, mockSpacePlanA, mockSpacePlanB],
      [mockSpaceForPlanA, mockSpaceForPlanB]
    );

    expect(allPlans.basePlan).toEqual(mockBasePlan);
    expect(allPlans.addOnPlans).toEqual(mockAddOnPlans);
    // checks if spacePlans is in alphabetical order
    expect(allPlans.spacePlans).toEqual([mockSpacePlanA, mockSpacePlanB]);
  });

  it('separates spacePlans depending on their accessibility - if the plan has correspondent spaces in accessibleSpaces or not', () => {
    const allPlans = findAllPlans([mockSpacePlanA, mockSpacePlanB], [mockSpaceForPlanA]);

    expect(allPlans.spacePlans).toEqual([mockSpacePlanA, mockSpacePlanB]);
    expect(allPlans.spacePlans[0].space?.isAccessible).toBe(true);
    expect(allPlans.spacePlans[1].space?.isAccessible).toBe(false);
  });

  it('adds price 0 to spaces that do not have a price', () => {
    const allPlans = findAllPlans(
      [mockSpacePlanB, mockSpacePlanWithoutPrice],
      [mockSpaceForPlanB, mockSpaceForPlanWithoutPrice]
    );

    expect(allPlans.spacePlans).toEqual([mockSpacePlanB, mockSpacePlanWithoutPrice]);
    expect(allPlans.spacePlans[0].price).toBe(mockSpacePlanB.price);
    expect(allPlans.spacePlans[1].price).toBe(0);
  });
});
