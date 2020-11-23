import { SpaceResource, Plan } from 'test/helpers/fakeFactory';
import { transformSpaceRatePlans } from './transformSpaceRatePlans';
import { freeSpace, unavailableFreeSpace } from './__mocks__/plans';

const freeResources = SpaceResource(1, 5, 'free_space');

describe('transformSpaceRatePlans', () => {
  it('should return an empty array if given no space rate plans', () => {
    expect(transformSpaceRatePlans()).toEqual([]);
  });

  it('should mark the transformed plan with isFree is the productPlanType is free_space', () => {
    const spaceRatePlans = [freeSpace];

    expect(transformSpaceRatePlans(spaceRatePlans, freeResources)).toEqual([
      expect.objectContaining({
        isFree: true,
      }),
    ]);
  });

  it('should mark a plan as disabled if there are any unavailabilityReasons', () => {
    const spaceRatePlans = [unavailableFreeSpace];

    expect(transformSpaceRatePlans(spaceRatePlans, freeResources)).toEqual([
      expect.objectContaining({
        disabled: true,
      }),
    ]);
  });

  it('should mark a plan as disabled if the the plan is free and cannot create more free spaces', () => {
    const spaceRatePlans = [freeSpace];

    expect(transformSpaceRatePlans(spaceRatePlans, SpaceResource(2, 2, 'free_space'))).toEqual([
      expect.objectContaining({
        disabled: true,
      }),
    ]);
  });

  it('should return expected transformed plans', () => {
    const createProductRatePlanCharges = (
      envLimit = 1,
      rolesLimit = 2,
      localesLimit = 3,
      ctLimit = 4,
      recordsLimit = 5
    ) => {
      return [
        {
          name: 'Environments',
          tiers: [{ endingUnit: envLimit }],
        },
        {
          name: 'Roles',
          tiers: [{ endingUnit: rolesLimit }],
        },
        {
          name: 'Locales',
          tiers: [{ endingUnit: localesLimit }],
        },
        {
          name: 'Content types',
          tiers: [{ endingUnit: ctLimit }],
        },
        {
          name: 'Records',
          tiers: [{ endingUnit: recordsLimit }],
        },
      ];
    };

    const spaceRatePlans = [
      Plan({
        productPlanType: 'free_space',
        productRatePlanCharges: createProductRatePlanCharges(),
      }),
      Plan({
        productPlanType: 'space_type_1',
        productRatePlanCharges: createProductRatePlanCharges(10, 20, 30, 40, 50),
      }),
      Plan({
        productPlanType: 'space_type_2',
        productRatePlanCharges: createProductRatePlanCharges(5, 10, 15, 20, 25),
        unavailabilityReasons: [{ type: 'something' }],
      }),
      Plan({
        productPlanType: 'space_type_3',
        productRatePlanCharges: createProductRatePlanCharges(9, 8, 7, 6, 5),
      }),
    ];

    expect(transformSpaceRatePlans(spaceRatePlans, SpaceResource(2, 2, 'free_space'))).toEqual([
      {
        isFree: true,
        currentPlan: false,
        disabled: true,
        includedResources: [
          {
            type: 'Environments',
            number: 2,
          },
          {
            type: 'Roles',
            number: 3,
          },
          {
            type: 'Locales',
            number: 3,
          },
          {
            type: 'Content types',
            number: 4,
          },
          {
            type: 'Records',
            number: 5,
          },
        ],
        ...spaceRatePlans[0],
      },
      {
        isFree: false,
        currentPlan: false,
        disabled: false,
        includedResources: [
          {
            type: 'Environments',
            number: 11,
          },
          {
            type: 'Roles',
            number: 21,
          },
          {
            type: 'Locales',
            number: 30,
          },
          {
            type: 'Content types',
            number: 40,
          },
          {
            type: 'Records',
            number: 50,
          },
        ],
        ...spaceRatePlans[1],
      },
      {
        isFree: false,
        currentPlan: false,
        disabled: true,
        includedResources: [
          {
            type: 'Environments',
            number: 6,
          },
          {
            type: 'Roles',
            number: 11,
          },
          {
            type: 'Locales',
            number: 15,
          },
          {
            type: 'Content types',
            number: 20,
          },
          {
            type: 'Records',
            number: 25,
          },
        ],
        ...spaceRatePlans[2],
      },
      {
        isFree: false,
        currentPlan: false,
        disabled: false,
        includedResources: [
          {
            type: 'Environments',
            number: 10,
          },
          {
            type: 'Roles',
            number: 9,
          },
          {
            type: 'Locales',
            number: 7,
          },
          {
            type: 'Content types',
            number: 6,
          },
          {
            type: 'Records',
            number: 5,
          },
        ],
        ...spaceRatePlans[3],
      },
    ]);
  });
});
