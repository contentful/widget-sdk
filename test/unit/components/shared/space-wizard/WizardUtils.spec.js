import { render } from 'enzyme';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('WizardUtils', function () {
  beforeEach(async function () {
    const system = createIsolatedSystem();

    system.set('utils/ResourceUtils', {
      resourceHumanNameMap: {
        asset: 'Assets',
        content_type: 'Content Types',
        entry: 'Entries',
        locale: 'Locales',
        environment: 'Environments',
        record: 'Records'
      }
    });

    this.WizardUtils = await system.import('components/shared/space-wizard/WizardUtils');
  });

  describe('formatPrice', function () {
    it('should return null if the given value is not finite', function () {
      expect(this.WizardUtils.formatPrice('hello')).toBe(null);
      expect(this.WizardUtils.formatPrice({})).toBe(null);
      expect(this.WizardUtils.formatPrice([])).toBe(null);
    });

    it('should have no decimal places if given an integer', function () {
      expect(this.WizardUtils.formatPrice(1)).toBe('$1');
      expect(this.WizardUtils.formatPrice(27)).toBe('$27');
    });

    it('should have a decimal place if given a float', function () {
      expect(this.WizardUtils.formatPrice(1.23)).toBe('$1.23');
      expect(this.WizardUtils.formatPrice(27.41)).toBe('$27.41');
      expect(this.WizardUtils.formatPrice(36.516)).toBe('$36.52');
    });
  });

  describe('unavailabilityTooltipNode', function () {
    beforeEach(function () {
      this.planAvailable = {
        name: 'Small',
        unavailabilityReasons: null
      };

      this.planUnavailableRoles = {
        name: 'Small 2',
        unavailabilityReasons: [
          {
            type: 'roleIncompatibility',
            additionalInfo: 'Editor'
          }
        ]
      };

      this.planUnavailableLimit = {
        name: 'Small 3',
        unavailabilityReasons: [
          {
            type: 'maximumLimitExceeded',
            usage: 5,
            maximumLimit: 3,
            additionalInfo: 'Locales'
          }
        ]
      };

      this.planUnavailableMultiple1 = {
        name: 'Small 4',
        unavailabilityReasons: [
          {
            type: 'maximumLimitExceeded',
            usage: 7,
            maximumLimit: 2,
            additionalInfo: 'Locales'
          },
          {
            type: 'roleIncompatibility',
            additionalInfo: 'Super Awesome Translator'
          }
        ]
      };

      this.planUnavailableMultiple2 = {
        name: 'Small 5',
        unavailabilityReasons: [
          {
            type: 'roleIncompatibility',
            additionalInfo: 'Super Awesome Translator'
          },
          {
            type: 'maximumLimitExceeded',
            usage: 8,
            maximumLimit: 4,
            additionalInfo: 'Locales'
          }
        ]
      };
    });

    it('should return null if there are no unavailabilityReasons', function () {
      expect(this.WizardUtils.unavailabilityTooltipNode(this.planAvailable)).toBe(null);
    });

    it('should have correct copy if unavailabilityReasons exists', function () {
      const rolesTooltip = render(this.WizardUtils.unavailabilityTooltipNode(this.planUnavailableRoles));
      const limitsTooltip = render(this.WizardUtils.unavailabilityTooltipNode(this.planUnavailableLimit));

      expect(rolesTooltip.text()).toBe('Migrate users from the Editor role before changing to this space type.');

      // Since these are in two paragraphs, these is no space between the text when rendered using .text()
      expect(limitsTooltip.text()).toBe('You are currently using more than the Small 3 space allows by 2 locales.Delete resources before changing to this space type.');
    });

    it('should handle multiple unavailabilityReasons, in order', function () {
      const tooltip1 = render(this.WizardUtils.unavailabilityTooltipNode(this.planUnavailableMultiple1));
      const tooltip2 = render(this.WizardUtils.unavailabilityTooltipNode(this.planUnavailableMultiple2));

      expect(tooltip1.text()).toBe('You are currently using more than the Small 4 space allows by 5 locales.Delete resources, and migrate users from the Super Awesome Translator role before changing to this space type.');
      expect(tooltip2.text()).toBe('You are currently using more than the Small 5 space allows by 4 locales.Migrate users from the Super Awesome Translator role, and delete resources before changing to this space type.');
    });
  });

  describe('with plans and resources', function () {
    beforeEach(function () {
      this.spaceRatePlans = [
        {
          name: 'Free',
          includedResources: [
            { type: 'Environments', number: 2 },
            { type: 'Content types', number: 25 }
          ]
        },
        {
          name: 'Unavailable Micro',
          includedResources: [
            { type: 'Environments', number: 50 },
            { type: 'Content types', number: 500 }
          ],
          unavailabilityReasons: [
            { type: 'arbitraryReason' }
          ]
        },
        {
          name: 'Micro',
          includedResources: [
            { type: 'Environments', number: 10 },
            { type: 'Content types', number: 50 }
          ]
        },
        {
          name: 'Macro',
          includedResources: [
            { type: 'Environments', number: 20 },
            { type: 'Content types', number: 100 }
          ]
        },
        {
          name: 'Mega',
          includedResources: [
            { type: 'Environments', number: 30 },
            { type: 'Content types', number: 200 }
          ]
        }
      ];

      this.ratePlansTooSmall = [
        {
          name: 'Free',
          includedResources: [
            { type: 'Environments', number: 2 },
            { type: 'Content types', number: 24 }
          ]
        },
        {
          name: 'Micro-ish',
          includedResources: [
            { type: 'Environments', number: 3 },
            { type: 'Content types', number: 25 }
          ]
        },
        {
          name: 'Less Micro-ish',
          includedResources: [
            { type: 'Environments', number: 5 },
            { type: 'Content types', number: 40 }
          ]
        }
      ];

      this.allInvalidPlans = [
        {
          name: 'Free',
          unavailabilityReasons: [
            { type: 'someIssue' }
          ]
        },
        {
          name: 'Micro',
          unavailabilityReasons: [
            { type: 'anotherIssue' }
          ]
        }
      ];

      this.resources = [
        {
          usage: 12,
          sys: {
            id: 'environment'
          }
        },
        {
          usage: 45,
          sys: {
            id: 'content_type'
          }
        }
      ];
    });

    describe('getRecommendedPlan', function () {
      it('should return null if no resources or empty resources array is given are given', function () {
        expect(this.WizardUtils.getRecommendedPlan(this.spaceRatePlans)).toBe(null);
        expect(this.WizardUtils.getRecommendedPlan(this.spaceRatePlans, [])).toBe(null);
      });

      it('should return null if no plan is valid (all are unavailable)', function () {
        expect(this.WizardUtils.getRecommendedPlan(this.allInvalidPlans, this.resources)).toBe(null);
      });

      it('should return null if no plan can fulfill resource requirements', function () {
        expect(this.WizardUtils.getRecommendedPlan(this.ratePlansTooSmall, this.resources)).toBe(null);
      });

      it('should return the first available plan in the list that fulfills the resource requirements', function () {
        expect(this.WizardUtils.getRecommendedPlan(this.spaceRatePlans, this.resources)).toEqual(this.spaceRatePlans[2]);
      });
    });

    describe('getPlanResourceFulfillment', function () {
      it('should return an empty object if no included resources are in the plan', function () {
        const plan = {
          name: 'Bizarro Plan with no Included Resources',
          includedResources: []
        };

        expect(this.WizardUtils.getPlanResourceFulfillment(plan, this.resources)).toEqual({});
      });

      it('should return an empty object if no resources are given', function () {
        expect(this.WizardUtils.getPlanResourceFulfillment(this.spaceRatePlans[3])).toEqual({});
      });

      it('should return an object with fulfillment information based on the included resources', function () {
        // Plan that is too small
        expect(this.WizardUtils.getPlanResourceFulfillment(this.spaceRatePlans[0], this.resources)).toEqual({
          'Environments': {
            reached: true,
            near: true
          },
          'Content types': {
            reached: true,
            near: true
          }
        });

        // Plan that fulfills but is near one resource limit (80%)
        expect(this.WizardUtils.getPlanResourceFulfillment(this.spaceRatePlans[2], this.resources)).toEqual({
          'Environments': {
            reached: true,
            near: true
          },
          'Content types': {
            reached: false,
            near: true
          }
        });

        // Plan that fulfills both resources
        expect(this.WizardUtils.getPlanResourceFulfillment(this.spaceRatePlans[3], this.resources)).toEqual({
          'Environments': {
            reached: false,
            near: false
          },
          'Content types': {
            reached: false,
            near: false
          }
        });
      });
    });
  });
});
