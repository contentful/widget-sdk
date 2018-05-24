import { render } from 'enzyme';

import { formatPrice, unavailabilityTooltipNode } from 'components/shared/space-wizard/WizardUtils';

describe('WizardUtils', function () {
  describe('formatPrice', function () {
    it('should return null if the given value is not finite', function () {
      expect(formatPrice('hello')).toBe(null);
      expect(formatPrice({})).toBe(null);
      expect(formatPrice([])).toBe(null);
    });

    it('should have no decimal places if given an integer', function () {
      expect(formatPrice(1)).toBe('$1');
      expect(formatPrice(27)).toBe('$27');
    });

    it('should have a decimal place if given a float', function () {
      expect(formatPrice(1.23)).toBe('$1.23');
      expect(formatPrice(27.41)).toBe('$27.41');
      expect(formatPrice(36.516)).toBe('$36.52');
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
      expect(unavailabilityTooltipNode(this.planAvailable)).toBe(null);
    });

    it('should have correct copy if unavailabilityReasons exists', function () {
      const rolesTooltip = render(unavailabilityTooltipNode(this.planUnavailableRoles));
      const limitsTooltip = render(unavailabilityTooltipNode(this.planUnavailableLimit));

      expect(rolesTooltip.text()).toBe('Migrate users from the Editor role before changing to this space type.');

      // Since these are in two paragraphs, these is no space between the text when rendered using .text()
      expect(limitsTooltip.text()).toBe('You are currently using more than the Small 3 space allows by 2 locales.Delete resources before changing to this space type.');
    });

    it('should handle multiple unavailabilityReasons, in order', function () {
      const tooltip1 = render(unavailabilityTooltipNode(this.planUnavailableMultiple1));
      const tooltip2 = render(unavailabilityTooltipNode(this.planUnavailableMultiple2));

      expect(tooltip1.text()).toBe('You are currently using more than the Small 4 space allows by 5 locales.Delete resources, and migrate users from the Super Awesome Translator role before changing to this space type.');
      expect(tooltip2.text()).toBe('You are currently using more than the Small 5 space allows by 4 locales.Migrate users from the Super Awesome Translator role, and delete resources before changing to this space type.');
    });
  });
});
