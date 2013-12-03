'use strict';

describe('Determine enforcement service', function () {

  function makeUserObject(usage, limit) {
    return {
      subscription: {
        usage: {
          permanent: usage
        },
        subscriptionPlan: {
          limits: {
            permanent: limit
          }
        }
      }
    };
  }

  var determineEnforcement;
  var userStub;

  beforeEach(function () {
    userStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('authentication', {
        getUser: userStub
      });
    });
    inject(function (_determineEnforcement_) {
      determineEnforcement = _determineEnforcement_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('returns null for unexistent reasons', function () {
    expect(determineEnforcement('random_reason')).toBeNull();
  });

  describe('returns maintenance message', function () {
    var enforcement;
    beforeEach(function () {
      enforcement = determineEnforcement(['system_maintenance']);
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
      enforcement = determineEnforcement(['system_maintenance', 'subscription_unsettled']);
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
      expect(enforcement.description).toMatch(/system/gi);
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
      enforcement = determineEnforcement(['subscription_unsettled']);
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
      enforcement = determineEnforcement(['period_usage_exceeded']);
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
      userStub.returns(makeUserObject({ apiKey: 3}, { apiKey: 3}));
      enforcement = determineEnforcement(['usage_exceeded']);
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
        userStub.returns(makeUserObject({ apiKey: 2}, { apiKey: 3}));
        enforcement = determineEnforcement(['usage_exceeded']);
      });

      it('tooltip is the same as the message', function () {
        expect(enforcement.tooltip).toEqual(enforcement.message);
      });
    });

    describe('with various metrics', function () {
      beforeEach(function () {
        userStub.returns(makeUserObject({
          apiKey: 2,
          entry: 4
        }, {
          apiKey: 3,
          entry: 4
        }));
        enforcement = determineEnforcement(['usage_exceeded']);
      });

      it('tooltip matches metric', function () {
        expect(enforcement.tooltip).toMatch('Entries');
      });
    });

  });

});
