'use strict';

describe('Enforcements service', function () {

  var enforcements;
  var userStub, organizationStub;
  var authorizationMock;

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
      authorizationMock = {
        spaceContext: {
          space: {
            sys: { createdBy: { sys: {id: 123} } },
            organization: organizationStub
          }
        }
      };
      $provide.value('authorization', authorizationMock);
      userStub.returns({ sys: {id: 123} });
      $provide.value('authentication', {
        getUser: userStub
      });
    });
    inject(function (_enforcements_) {
      enforcements = _enforcements_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('determines enforcements', function () {

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

      it('has a description', function () {
        expect(enforcement.description).toBeDefined();
      });

      it('has a tooltip', function () {
        expect(enforcement.tooltip).toBeDefined();
      });

      it('tooltip equals error message', function () {
        expect(enforcement.tooltip).toEqual(enforcement.message);
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

      it('has a description', function () {
        expect(enforcement.description).toBeDefined();
      });

      it('description matches reason', function () {
        expect(enforcement.description).toMatch(/maintenance/gi);
      });

      it('has a tooltip', function () {
        expect(enforcement.tooltip).toBeDefined();
      });

      it('tooltip equals error message', function () {
        expect(enforcement.tooltip).toEqual(enforcement.message);
      });

      it('tooltip matches reason', function () {
        expect(enforcement.tooltip).toMatch(/system/gi);
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

      it('has a description', function () {
        expect(enforcement.description).toBeDefined();
      });

      it('has a tooltip', function () {
        expect(enforcement.tooltip).toBeDefined();
      });

      it('tooltip equals error message', function () {
        expect(enforcement.tooltip).toEqual(enforcement.message);
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

      it('has a description', function () {
        expect(enforcement.description).toBeDefined();
      });

      it('has a tooltip', function () {
        expect(enforcement.tooltip).toBeDefined();
      });

      it('tooltip is empty', function () {
        expect(enforcement.tooltip).toBe('');
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

      it('has a description', function () {
        expect(enforcement.description).toBeDefined();
      });

      it('has a tooltip', function () {
        expect(enforcement.tooltip).toBeDefined();
      });

      it('tooltip matches metric', function () {
        expect(enforcement.tooltip).toMatch('API keys');
      });

      describe('with no specific metric', function () {
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['usageExceeded']);
        });

        it('tooltip is the same as the message', function () {
          expect(enforcement.tooltip).toEqual(enforcement.message);
        });
      });

      describe('with various metrics', function () {
        beforeEach(function () {
          enforcement = enforcements.determineEnforcement(['usageExceeded'], 'Entry');
        });

        it('tooltip matches metric', function () {
          expect(enforcement.tooltip).toMatch('Entries');
        });
      });
    });

  });

  describe('gets period usage', function () {
    var enforcement;
    beforeEach(function () {
      organizationStub.usage.period.assetBandwidth = 5;
      enforcement = enforcements.getPeriodUsage();
    });

    it('has an error', function () {
      expect(enforcement.message).toBeDefined();
    });

    it('has a description', function () {
      expect(enforcement.description).toBeDefined();
    });

    it('has a tooltip', function () {
      expect(enforcement.tooltip).toBeDefined();
    });

    it('tooltip is empty', function () {
      expect(enforcement.tooltip).toBe('');
    });
  });

  describe('gets no period usage', function () {
    var enforcement;
    beforeEach(function () {
      enforcement = enforcements.getPeriodUsage();
    });

    it('has an error', function () {
      expect(enforcement).toBeFalsy();
    });
  });

  describe('gets tooltip messages', function () {
    it('gets an api key message', function () {
      expect(enforcements.getTooltipMessage('apiKey')).toMatch('API keys');
    });
  });

  describe('computes metrics usage', function () {
    it('if no space context exists returns no message', function() {
      delete authorizationMock.spaceContext;
      expect(enforcements.computeUsage()).toBeUndefined();
    });

    it('if no space exists returns no message', function() {
      delete authorizationMock.spaceContext.space;
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
