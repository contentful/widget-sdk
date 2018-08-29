import * as SubscriptionUtils from 'utils/SubscriptionUtils';

describe('utils/SubscriptionUtils', () => {
  beforeEach(function() {
    function createPlan(name, price, ratePlanCharges, isBase) {
      return {
        name,
        price,
        ratePlanCharges,
        planType: isBase ? 'base' : 'space'
      };
    }

    function createTier({ price, startingUnit, endingUnit, priceFormat }) {
      return {
        price,
        startingUnit,
        endingUnit,
        priceFormat
      };
    }

    function createRPC({ name, unitType, tiers }) {
      return {
        name,
        unitType,
        tiers: tiers && tiers.map(createTier)
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
            priceFormat: 'FlatFee'
          },
          {
            price: 10,
            startingUnit: 11,
            endingUnit: null,
            priceFormat: 'PerUnit'
          }
        ]
      },
      {
        name: 'Free spaces',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 2,
            priceFormat: 'PerUnit'
          }
        ]
      },
      {
        name: 'SSO',
        unitType: 'feature'
      }
    ].map(createRPC);

    const microTiers = [
      {
        name: 'Roles',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 7,
            priceFormat: 'FlatFee'
          }
        ]
      }
    ].map(createRPC);

    const macroTiers = [
      {
        name: 'Roles',
        tiers: [
          {
            price: 0,
            startingUnit: 0,
            endingUnit: 12,
            priceFormat: 'FlatFee'
          }
        ]
      },
      {
        name: 'Custom Roles',
        unitType: 'feature'
      }
    ].map(createRPC);

    this.basePlan = createPlan('Basic Platform', 0, baseRPCs, true);
    this.microPlan = createPlan('Micro Plan', 14, microTiers);
    this.macroPlan = createPlan('Macro Plan', 99, macroTiers);

    this.allPlans = [this.basePlan, this.microPlan, this.macroPlan];
  });

  describe('#calculateUsersCost', () => {
    it('should calculate the cost for users depending on the tiers', function() {
      // Free tier is users 0 - 10
      const basePlan = this.basePlan;

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
    it('should calculate the meta information correctly', function() {
      const basePlan = this.basePlan;
      // 0 - 10 are free, 11+ are paid

      expect(SubscriptionUtils.calcUsersMeta({ basePlan, numMemberships: 3 })).toEqual({
        numFree: 3,
        numPaid: 0,
        cost: 0
      });

      expect(SubscriptionUtils.calcUsersMeta({ basePlan, numMemberships: 8 })).toEqual({
        numFree: 8,
        numPaid: 0,
        cost: 0
      });

      expect(SubscriptionUtils.calcUsersMeta({ basePlan, numMemberships: 17 })).toEqual({
        numFree: 10,
        numPaid: 7,
        cost: 70
      });
    });
  });

  describe('#calculateTotalPrice', () => {
    it('should be able to calculate the price based on just the base tier with given users', function() {
      const plansWithMemberships = {
        allPlans: [this.basePlan]
      };

      plansWithMemberships.numMemberships = 3;
      expect(SubscriptionUtils.calculateTotalPrice(plansWithMemberships)).toBe(0);

      plansWithMemberships.numMemberships = 7;
      expect(SubscriptionUtils.calculateTotalPrice(plansWithMemberships)).toBe(0);

      plansWithMemberships.numMemberships = 12;
      expect(SubscriptionUtils.calculateTotalPrice(plansWithMemberships)).toBe(20);
    });

    it('should calculate the cost of all spaces and users together', function() {
      const plansWithMemberships = {
        allPlans: this.allPlans
      };

      plansWithMemberships.numMemberships = 3;
      expect(SubscriptionUtils.calculateTotalPrice(plansWithMemberships)).toBe(113);

      plansWithMemberships.numMemberships = 12;
      expect(SubscriptionUtils.calculateTotalPrice(plansWithMemberships)).toBe(133);
    });
  });

  describe('#getEnabledFeatures', () => {
    it('should return an empty array if no features are present', function() {
      expect(SubscriptionUtils.getEnabledFeatures(this.microPlan).length).toBe(0);
    });

    it('should return the feature RPCs if present', function() {
      expect(SubscriptionUtils.getEnabledFeatures(this.macroPlan).length).toBe(1);
      expect(SubscriptionUtils.getEnabledFeatures(this.basePlan).length).toBe(1);
    });
  });

  describe('#calculatePlansCost', () => {
    it('should return 0 if given no plans', () => {
      const plans = [];

      expect(SubscriptionUtils.calculatePlansCost({ plans })).toBe(0);
    });

    it('should return 0 if all the plan prices are 0', function() {
      const plans = [this.basePlan];

      expect(SubscriptionUtils.calculatePlansCost({ plans })).toBe(0);
    });

    it('should return the correct price for all plans given', function() {
      const plans = this.allPlans;

      expect(SubscriptionUtils.calculatePlansCost({ plans })).toBe(113);
    });
  });
});
