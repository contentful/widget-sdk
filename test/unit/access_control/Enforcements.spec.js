'use strict';

describe('Enforcements service', () => {
  let enforcements;
  let organizationMock;
  let OrganizationRoles;

  beforeEach(function () {
    module('contentful/test');

    enforcements = this.$inject('access_control/Enforcements');
    OrganizationRoles = this.$inject('services/OrganizationRoles');
    OrganizationRoles.setUser({ sys: {id: 123} });

    organizationMock = {
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
    };
  });

  describe('determines enforcements', () => {
    it('returns null for no reasons', () => {
      expect(enforcements.determineEnforcement(organizationMock)).toBeNull();
    });

    it('returns null for unexistent reasons', () => {
      expect(enforcements.determineEnforcement(organizationMock, ['randomReason'])).toBeNull();
    });

    describe('returns maintenance message', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(organizationMock, ['systemMaintenance']);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });

    describe('returns maintenance message with multiple reasons', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(organizationMock, ['systemMaintenance', 'subscriptionUnsettled']);
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
        enforcement = enforcements.determineEnforcement(organizationMock, ['periodUsageExceeded']);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });

    describe('returns usage exceeded', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(organizationMock, ['usageExceeded'], 'ApiKey');
      });

      it('has a tooltip but no message', () => {
        expect(enforcement.tooltip).toBeDefined();
        expect(enforcement.message).toBeUndefined();
      });
    });
  });

  describe('gets period usage', () => {
    describe('with space context', () => {
      beforeEach(() => {
        organizationMock.usage.period.assetBandwidth = 5;
      });

      it('has an error when user is an owner', () => {
        sinon.stub(OrganizationRoles, 'isOwner').returns(true);
        expect(enforcements.getPeriodUsage(organizationMock).message).toBeDefined();
      });

      it('has no error when user is not an owner', () => {
        sinon.stub(OrganizationRoles, 'isOwner').returns(false);
        expect(enforcements.getPeriodUsage(organizationMock)).toBeUndefined();
      });

      it('has no error when subscription has additional usage enabled', () => {
        sinon.stub(OrganizationRoles, 'isOwner').returns(true);
        organizationMock.subscription.additional_usage_allowed = true;
        expect(enforcements.getPeriodUsage(organizationMock)).toBeUndefined();
      });
    });
  });

  describe('gets no period usage', () => {
    it('has an error', () => {
      expect(enforcements.getPeriodUsage(organizationMock)).toBeFalsy();
    });
  });

  describe('computes metrics usage', () => {
    it('for no exceeded usage metric returns no message', () => {
      expect(enforcements.computeUsageForOrganization(organizationMock)).toBeUndefined();
    });

    it('for exceeded usage metric returns message', () => {
      organizationMock.usage.period.assetBandwidth = 5;
      expect(enforcements.computeUsageForOrganization(organizationMock)).toMatch('Bandwidth');
    });

    it('for exceeded usage metric with filter returns message', () => {
      organizationMock.usage.permanent.entry = 5;
      organizationMock.usage.permanent.user = 5;
      expect(enforcements.computeUsageForOrganization(organizationMock, 'user')).toMatch('Users');
    });
  });
});
