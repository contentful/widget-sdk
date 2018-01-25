'use strict';

describe('Enforcements service', function () {
  let enforcements;
  let organizationMock;
  let spaceContext;
  let OrganizationRoles;

  beforeEach(function () {
    module('contentful/test');

    const cfStub = this.$inject('cfStub');
    enforcements = this.$inject('access_control/Enforcements');
    spaceContext = this.$inject('spaceContext');
    OrganizationRoles = this.$inject('services/OrganizationRoles');
    OrganizationRoles.setUser({ sys: {id: 123} });

    _.extend(spaceContext, cfStub.mockSpaceContext());

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

  describe('determines enforcements', function () {
    describe('with a space context', function () {
      it('returns null for no reasons', function () {
        expect(enforcements.determineEnforcement()).toBeNull();
      });

      it('returns null for unexistent reasons', function () {
        expect(enforcements.determineEnforcement('randomReason')).toBeNull();
      });

      describe('returns maintenance message', function () {
        let enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['systemMaintenance']);
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });
      });

      describe('returns maintenance message with multiple reasons', function () {
        let enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['systemMaintenance', 'subscriptionUnsettled']);
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });

        it('error matches reason', function () {
          expect(enforcement.message).toMatch(/system/gi);
        });
      });

      describe('returns period usage exceeded', function () {
        let enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['periodUsageExceeded']);
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });
      });

      describe('returns usage exceeded', function () {
        let enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['usageExceeded'], 'ApiKey');
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });
      });
    });
  });

  describe('gets period usage', function () {
    describe('with space context', function () {
      beforeEach(function () {
        organizationMock.usage.period.assetBandwidth = 5;
        spaceContext.organizationContext.organization = organizationMock;
      });

      it('has an error when user is an owner', function () {
        sinon.stub(OrganizationRoles, 'isOwner').returns(true);
        expect(enforcements.getPeriodUsage().message).toBeDefined();
      });

      it('has no error when user is not an owner', function () {
        sinon.stub(OrganizationRoles, 'isOwner').returns(false);
        expect(enforcements.getPeriodUsage()).toBeUndefined();
      });

      it('has no error when subscription has additional usage enabled', function () {
        sinon.stub(OrganizationRoles, 'isOwner').returns(true);
        sinon.stub(spaceContext.subscription, 'isAdditionalUsageAllowed').returns(true);
        expect(enforcements.getPeriodUsage()).toBeUndefined();
      });
    });
  });

  describe('gets no period usage', function () {
    describe('with space context', function () {
      let enforcement;
      beforeEach(function () {
        spaceContext.space.data.organization = organizationMock;
        enforcement = enforcements.getPeriodUsage();
      });


      it('has an error', function () {
        expect(enforcement).toBeFalsy();
      });
    });
  });

  describe('computes metrics usage', function () {
    beforeEach(function () {
      spaceContext.organizationContext.organization = organizationMock;
    });

    it('if no space exists returns no message', function () {
      delete spaceContext.space;
      expect(enforcements.computeUsage()).toBeUndefined();
    });

    it('for no exceeded usage metric returns no message', function () {
      expect(enforcements.computeUsage()).toBeUndefined();
    });

    it('for exceeded usage metric returns message', function () {
      organizationMock.usage.period.assetBandwidth = 5;
      expect(enforcements.computeUsage()).toMatch('Bandwidth');
    });

    it('for exceeded usage metric with filter returns message', function () {
      organizationMock.usage.permanent.entry = 5;
      organizationMock.usage.permanent.user = 5;
      expect(enforcements.computeUsage('user')).toMatch('Users');
    });
  });
});
