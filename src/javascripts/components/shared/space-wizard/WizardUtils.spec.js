import { render } from 'enzyme';
import * as WizardUtils from './WizardUtils.es6';

jest.mock('utils/ResourceUtils.es6', () => ({
  resourceHumanNameMap: {
    asset: 'Assets',
    content_type: 'Content Types',
    entry: 'Entries',
    locale: 'Locales',
    environment: 'Environments',
    record: 'Records'
  }
}));

describe('WizardUtils', function() {
  describe('formatPrice', function() {
    it('should return null if the given value is not finite', function() {
      expect(WizardUtils.formatPrice('hello')).toBeNull();
      expect(WizardUtils.formatPrice({})).toBeNull();
      expect(WizardUtils.formatPrice([])).toBeNull();
    });

    it('should have no decimal places if given an integer', function() {
      expect(WizardUtils.formatPrice(1)).toBe('$1');
      expect(WizardUtils.formatPrice(27)).toBe('$27');
    });

    it('should have a decimal place if given a float', function() {
      expect(WizardUtils.formatPrice(1.23)).toBe('$1.23');
      expect(WizardUtils.formatPrice(27.41)).toBe('$27.41');
      expect(WizardUtils.formatPrice(36.516)).toBe('$36.52');
    });
  });

  describe('getRolesTooltip', function() {
    const intro = 'This space type includes the';
    const testRolesTooltip = function(number, roles, text) {
      const tooltip = WizardUtils.getRolesTooltip(number, { roles });
      return expect(tooltip).toBe(`${intro} ${text}`);
    };

    it('returns tooltip for a plan with the admin role only', function() {
      testRolesTooltip(1, [], 'Admin role only');
    });

    it('returns the tooltip text for a plan with various roles', function() {
      testRolesTooltip(3, ['Editor', 'Translator'], 'Admin, Editor and Translator roles');
    });

    it('returns the tooltip text for a plan with multiple translator roles', function() {
      testRolesTooltip(
        5,
        ['Editor', 'Translator', 'Translator 2', 'Translator3'],
        'Admin, Editor and 3 Translator roles'
      );
    });

    it('returns the tooltip text for a plan with custom roles', function() {
      testRolesTooltip(
        10,
        ['Editor', 'Translator'],
        'Admin, Editor and Translator roles and an additional 7 custom roles'
      );
    });
  });

  describe('unavailabilityTooltipNode', function() {
    const data = {};

    beforeEach(function() {
      data.planAvailable = {
        name: 'Small',
        unavailabilityReasons: null
      };

      data.planUnavailableRoles = {
        name: 'Small 2',
        unavailabilityReasons: [
          {
            type: 'roleIncompatibility',
            additionalInfo: 'Editor'
          }
        ]
      };

      data.planUnavailableLimit = {
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

      data.planUnavailableMultiple1 = {
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

      data.planUnavailableMultiple2 = {
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

    it('should return null if there are no unavailabilityReasons', function() {
      expect(WizardUtils.unavailabilityTooltipNode(data.planAvailable)).toBeNull();
    });

    it('should have correct copy if unavailabilityReasons exists', function() {
      const rolesTooltip = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableRoles));
      const limitsTooltip = render(
        WizardUtils.unavailabilityTooltipNode(data.planUnavailableLimit)
      );

      expect(rolesTooltip.text()).toBe(
        'Migrate users from the Editor role before changing to this space type.'
      );

      // Since these are in two paragraphs, these is no space between the text when rendered using .text()
      expect(limitsTooltip.text()).toBe(
        'You are currently using more than the Small 3 space allows by 2 locales.Delete resources before changing to this space type.'
      );
    });

    it('should handle multiple unavailabilityReasons, in order', function() {
      const tooltip1 = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableMultiple1));
      const tooltip2 = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableMultiple2));

      expect(tooltip1.text()).toBe(
        'You are currently using more than the Small 4 space allows by 5 locales.Delete resources, and migrate users from the Super Awesome Translator role before changing to this space type.'
      );
      expect(tooltip2.text()).toBe(
        'You are currently using more than the Small 5 space allows by 4 locales.Migrate users from the Super Awesome Translator role, and delete resources before changing to this space type.'
      );
    });
  });

  describe('with plans and resources', function() {
    const data = {};
    beforeEach(function() {
      data.spaceRatePlans = [
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
          unavailabilityReasons: [{ type: 'arbitraryReason' }]
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

      data.ratePlansTooSmall = [
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

      data.allInvalidPlans = [
        {
          name: 'Free',
          unavailabilityReasons: [{ type: 'someIssue' }]
        },
        {
          name: 'Micro',
          unavailabilityReasons: [{ type: 'anotherIssue' }]
        }
      ];

      data.resources = [
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

    describe('getRecommendedPlan', function() {
      it('should return null if no resources or empty resources array is given are given', function() {
        expect(WizardUtils.getRecommendedPlan(data.spaceRatePlans)).toBeNull();
        expect(WizardUtils.getRecommendedPlan(data.spaceRatePlans, [])).toBeNull();
      });

      it('should return null if no plan is valid (all are unavailable)', function() {
        expect(WizardUtils.getRecommendedPlan(data.allInvalidPlans, data.resources)).toBeNull();
      });

      it('should return null if no plan can fulfill resource requirements', function() {
        expect(WizardUtils.getRecommendedPlan(data.ratePlansTooSmall, data.resources)).toBeNull();
      });

      it('should return the first available plan in the list that fulfills the resource requirements', function() {
        expect(WizardUtils.getRecommendedPlan(data.spaceRatePlans, data.resources)).toEqual(
          data.spaceRatePlans[3]
        );
      });
    });

    describe('getPlanResourceFulfillment', function() {
      it('should return an empty object if no included resources are in the plan', function() {
        const plan = {
          name: 'Bizarro Plan with no Included Resources',
          includedResources: []
        };

        expect(WizardUtils.getPlanResourceFulfillment(plan, data.resources)).toEqual({});
      });

      it('should return an empty object if no resources are given', function() {
        expect(WizardUtils.getPlanResourceFulfillment(data.spaceRatePlans[3])).toEqual({});
      });

      it('should return an object with fulfillment information based on the included resources', function() {
        // Plan that is too small
        expect(
          WizardUtils.getPlanResourceFulfillment(data.spaceRatePlans[0], data.resources)
        ).toEqual({
          Environments: {
            reached: true,
            near: true
          },
          'Content types': {
            reached: true,
            near: true
          }
        });

        // Plan that fulfills but is near one resource limit (80%)
        expect(
          WizardUtils.getPlanResourceFulfillment(data.spaceRatePlans[2], data.resources)
        ).toEqual({
          Environments: {
            reached: true,
            near: true
          },
          'Content types': {
            reached: false,
            near: true
          }
        });

        // Plan that fulfills both resources
        expect(
          WizardUtils.getPlanResourceFulfillment(data.spaceRatePlans[3], data.resources)
        ).toEqual({
          Environments: {
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
