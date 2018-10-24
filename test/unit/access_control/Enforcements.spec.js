'use strict';

describe('access_control/Enforcements.es6', () => {
  let enforcements;
  let OrganizationRoles;
  let spaceMock;

  beforeEach(function() {
    module('contentful/test');

    enforcements = this.$inject('access_control/Enforcements.es6');
    OrganizationRoles = this.$inject('services/OrganizationRoles.es6');
    OrganizationRoles.setUser({ sys: { id: 123 } });

    spaceMock = {
      organization: {
        usage: {
          permanent: {
            entry: 0,
            user: 0
          },
          period: {
            assetBandwidth: 0,
            contentDeliveryApiRequest: 0
          }
        },
        subscription: {
          additional_usage_allowed: false
        },
        subscriptionPlan: {
          limits: {
            permanent: {
              entry: 5,
              user: 5
            },
            period: {
              assetBandwidth: 5,
              contentDeliveryApiRequest: 5
            }
          }
        }
      },
      sys: {
        id: 'space_1234'
      }
    };
  });

  describe('determines enforcements', () => {
    it('returns null for no reasons', () => {
      expect(enforcements.determineEnforcement(spaceMock)).toBeNull();
    });

    it('returns null for unexistent reasons', () => {
      expect(enforcements.determineEnforcement(spaceMock, ['randomReason'])).toBeNull();
    });

    describe('returns maintenance message', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['systemMaintenance']);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });

    describe('returns maintenance message with multiple reasons', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, [
          'systemMaintenance',
          'subscriptionUnsettled'
        ]);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });

      it('error matches reason', () => {
        expect(enforcement.message).toMatch(/system/gi);
      });
    });

    describe('returns period usage exceeded', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['periodUsageExceeded']);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });

    describe('returns usage exceeded', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['usageExceeded'], 'ApiKey');
      });

      it('has a tooltip but no message', () => {
        expect(enforcement.tooltip).toBeDefined();
        expect(enforcement.message).toBeUndefined();
      });
    });

    describe('returns readOnlySpace message', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['readOnlySpace'], 'Entry');
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });
  });

  describe('computes metrics usage', () => {
    it('for no exceeded usage metric returns no message', () => {
      expect(enforcements.computeUsageForOrganization(spaceMock.organization)).toBeUndefined();
    });

    it('for exceeded usage metric returns message', () => {
      spaceMock.organization.usage.period.assetBandwidth = 5;
      expect(enforcements.computeUsageForOrganization(spaceMock.organization)).toMatch('Bandwidth');
    });

    it('for exceeded usage metric with filter returns message', () => {
      spaceMock.organization.usage.permanent.entry = 5;
      spaceMock.organization.usage.permanent.user = 5;
      expect(enforcements.computeUsageForOrganization(spaceMock.organization, 'user')).toMatch(
        'Users'
      );
    });
  });
});
