'use strict';

describe('Enforcements service', function () {

  var enforcements;
  var userStub, organizationStub;
  var spaceContext;

  beforeEach(function () {
    userStub = sinon.stub();
    organizationStub = {
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

    module('contentful/test', function ($provide) {
      userStub.returns({ sys: {id: 123} });
      $provide.value('authentication', {
        getUser: userStub
      });
    });
    inject(function (_enforcements_, cfStub) {
      enforcements = _enforcements_;

      spaceContext = cfStub.mockSpaceContext();
    });
  });

  describe('determines enforcements', function () {

    it('throws if no space context is defined', function() {
      expect(enforcements.determineEnforcement).toThrow();
    });

    describe('with a space context', function() {

      beforeEach(function () {
        enforcements.setSpaceContext(spaceContext);
      });

      it('returns null for no reasons', function () {
        expect(enforcements.determineEnforcement()).toBeNull();
      });

      it('returns null for unexistent reasons', function () {
        expect(enforcements.determineEnforcement('randomReason')).toBeNull();
      });

      describe('returns maintenance message', function () {
        var enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['systemMaintenance']);
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });

      });

      describe('returns maintenance message with multiple reasons', function () {
        var enforcement;
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

      describe('returns subscription unsettled', function () {
        var enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['subscriptionUnsettled']);
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });

      });

      describe('returns period usage exceeded', function () {
        var enforcement;
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['periodUsageExceeded']);
        });

        it('has an error', function () {
          expect(enforcement.message).toBeDefined();
        });

      });

      describe('returns usage exceeded', function () {
        var enforcement;
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

    it('throws if no space context is defined', function() {
      expect(enforcements.determineEnforcement).toThrow();
    });

    describe('with space context', function() {

      var enforcement;
      beforeEach(function () {
        organizationStub.usage.period.assetBandwidth = 5;
        enforcements.setSpaceContext(spaceContext);
        spaceContext.space.data.organization = organizationStub;
        enforcement = enforcements.getPeriodUsage();
      });

      it('has an error', function () {
        expect(enforcement.message).toBeDefined();
      });

    });
  });

  describe('gets no period usage', function () {

    it('throws if no space context is defined', function() {
      expect(enforcements.determineEnforcement).toThrow();
    });

    describe('with space context', function() {

      var enforcement;
      beforeEach(function () {
        enforcements.setSpaceContext(spaceContext);
        spaceContext.space.data.organization = organizationStub;
        enforcement = enforcements.getPeriodUsage();
      });


      it('has an error', function () {
        expect(enforcement).toBeFalsy();
      });
    });
  });

  describe('computes metrics usage', function () {
    beforeEach(function () {
      enforcements.setSpaceContext(spaceContext);
      spaceContext.space.data.organization = organizationStub;
    });

    it('if no space exists returns no message', function() {
      delete spaceContext.space;
      expect(enforcements.computeUsage()).toBeUndefined();
    });

    it('for no exceeded usage metric returns no message', function () {
      expect(enforcements.computeUsage()).toBeUndefined();
    });

    it('for exceeded usage metric returns message', function () {
      organizationStub.usage.period.assetBandwidth = 5;
      expect(enforcements.computeUsage()).toMatch('Bandwidth');
    });

    it('for exceeded usage metric with filter returns message', function () {
      organizationStub.usage.permanent.entry = 5;
      organizationStub.usage.permanent.user = 5;
      expect(enforcements.computeUsage('user')).toMatch('Users');
    });
  });


});
