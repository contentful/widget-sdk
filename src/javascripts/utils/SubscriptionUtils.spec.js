import * as SubscriptionUtils from './SubscriptionUtils';

describe('utils/SubscriptionUtils', () => {
  let basePlan;
  let microPlan;
  let macroPlan;

  beforeEach(function () {
    function createPlan(name, price, ratePlanCharges, isBase) {
      return {
        name,
        price,
        ratePlanCharges,
        planType: isBase ? 'base' : 'space',
      };
    }

    function createTier({ price, startingUnit, endingUnit, priceFormat }) {
      return {
        price,
        startingUnit,
        endingUnit,
        priceFormat,
      };
    }

    function createRPC({ name, unitType, tiers }) {
      return {
        name,
        unitType,
        tiers: tiers && tiers.map(createTier),
      };
    }

    const baseRPCs = [
      {
        name: 'Users',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 10,
            priceFormat: 'FlatFee',
          },
          {
            price: 10,
            startingUnit: 11,
            endingUnit: null,
            priceFormat: 'PerUnit',
          },
        ],
      },
      {
        name: 'Free spaces',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 2,
            priceFormat: 'PerUnit',
          },
        ],
      },
      {
        name: 'SSO',
        unitType: 'feature',
      },
    ].map(createRPC);

    const microTiers = [
      {
        name: 'Roles',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 7,
            priceFormat: 'FlatFee',
          },
        ],
      },
    ].map(createRPC);

    const macroTiers = [
      {
        name: 'Roles',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 12,
            priceFormat: 'FlatFee',
          },
        ],
      },
      {
        name: 'Custom Roles',
        unitType: 'feature',
      },
    ].map(createRPC);

    basePlan = createPlan('Basic Platform', 0, baseRPCs, true);
    microPlan = createPlan('Micro Plan', 14, microTiers);
    macroPlan = createPlan('Macro Plan', 99, macroTiers);
  });

  describe('#calculateUsersCost', () => {
    it('should calculate the cost for users depending on the tiers', function () {
      expect(SubscriptionUtils.calculateUsersCost({ basePlan, numMemberships: 3 })).toBe(0);
      expect(SubscriptionUtils.calculateUsersCost({ basePlan, numMemberships: 7 })).toBe(0);
      expect(SubscriptionUtils.calculateUsersCost({ basePlan, numMemberships: 10 })).toBe(0);

      // Paid tier is 11+, $10 per
      expect(SubscriptionUtils.calculateUsersCost({ basePlan, numMemberships: 11 })).toBe(10);
      expect(SubscriptionUtils.calculateUsersCost({ basePlan, numMemberships: 15 })).toBe(50);
      expect(SubscriptionUtils.calculateUsersCost({ basePlan, numMemberships: 24 })).toBe(140);
    });
  });

  describe('#calcUsersMeta', () => {
    it('should calculate the meta information correctly', function () {
      // 0 - 10 are free, 11+ are paid
      expect(SubscriptionUtils.calcUsersMeta({ basePlan, numMemberships: 3 })).toEqual({
        numFree: 3,
        numPaid: 0,
        cost: 0,
        unitPrice: 10,
        hardLimit: null,
      });

      expect(SubscriptionUtils.calcUsersMeta({ basePlan, numMemberships: 8 })).toEqual({
        numFree: 8,
        numPaid: 0,
        cost: 0,
        unitPrice: 10,
        hardLimit: null,
      });

      expect(SubscriptionUtils.calcUsersMeta({ basePlan, numMemberships: 17 })).toEqual({
        numFree: 10,
        numPaid: 7,
        cost: 70,
        unitPrice: 10,
        hardLimit: null,
      });
    });

    it('should handle a hard cap on the free tier', () => {
      const basePlanWithHardLimit = {
        ...basePlan,
        ratePlanCharges: [
          {
            name: 'Users',
            tiers: [
              {
                price: 0,
                startingUnit: 0,
                endingUnit: 10,
                priceFormat: 'FlatFee',
              },
            ],
          },
        ],
      };

      expect(
        SubscriptionUtils.calcUsersMeta({ basePlan: basePlanWithHardLimit, numMemberships: 17 })
      ).toEqual({
        numFree: 10,
        numPaid: 7,
        cost: 0,
        unitPrice: undefined,
        hardLimit: 10,
      });
    });

    it('should handle an unlimited free tier', () => {
      const basePlanWithNoCap = {
        ...basePlan,
        ratePlanCharges: [
          {
            name: 'Users',
            tiers: [
              {
                price: 0,
                startingUnit: 0,
                endingUnit: null,
                priceFormat: 'FlatFee',
              },
            ],
          },
        ],
      };

      expect(
        SubscriptionUtils.calcUsersMeta({ basePlan: basePlanWithNoCap, numMemberships: 17 })
      ).toEqual({
        numFree: 17,
        numPaid: 0,
        cost: 0,
        unitPrice: undefined,
        hardLimit: null,
      });
    });
  });

  describe('#calculateSubscriptionCosts', () => {
    it('should be able to calculate the price based on just the base tier with given users', function () {
      expect(SubscriptionUtils.calculateSubscriptionCosts(basePlan, [], [], 3)).toMatchObject({
        lineItems: [],
        total: 0,
      });
      expect(SubscriptionUtils.calculateSubscriptionCosts(basePlan, [], [], 7)).toMatchObject({
        lineItems: [],
        total: 0,
      });
      expect(SubscriptionUtils.calculateSubscriptionCosts(basePlan, [], [], 12)).toMatchObject({
        lineItems: [{ name: 'Additional users', price: 20 }],
        total: 20,
      });
    });

    it('should calculate the cost of all spaces and users together', function () {
      expect(
        SubscriptionUtils.calculateSubscriptionCosts(basePlan, [microPlan, macroPlan], [], 3)
      ).toMatchObject({
        lineItems: [{ name: 'Spaces', price: 113 }],
        total: 113,
      });
      expect(
        SubscriptionUtils.calculateSubscriptionCosts(basePlan, [microPlan, macroPlan], [], 12)
      ).toMatchObject({
        lineItems: [
          { name: 'Spaces', price: 113 },
          { name: 'Additional users', price: 20 },
        ],
        total: 133,
      });
    });
  });

  describe('#getEnabledFeatures', () => {
    it('should return an empty array if no features are present', function () {
      expect(SubscriptionUtils.getEnabledFeatures(microPlan)).toHaveLength(0);
    });

    it('should return the feature RPCs if present', function () {
      expect(SubscriptionUtils.getEnabledFeatures(macroPlan)).toHaveLength(1);
      expect(SubscriptionUtils.getEnabledFeatures(basePlan)).toHaveLength(1);
    });
  });
});
