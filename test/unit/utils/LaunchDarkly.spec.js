import * as K from 'helpers/mocks/kefir';

describe('utils/LaunchDarkly', function () {
  // mocks
  const client = {
    on: sinon.stub(),
    off: sinon.stub(),
    identify: sinon.stub(),
    variation: sinon.stub()
  };

  const LD = {
    initialize: sinon.stub().returns(client)
  };

  beforeEach(function () {
    module('contentful/test', $provide => {
      $provide.constant('libs/launch-darkly-client', LD);
    });

    this.user = {
      email: 'user@example.com',
      organizationMemberships: [
        {
          organization: {
            name: 'test-org',
            subscription: {
              status: 'free'
            }
          }
        }
      ],
      sys: {
        id: 1
      }
    };

    // TODO: remove corresponding bits after deprecated method
    // utils/LaunchDarkly#getTest() is removed
    this.unqualifiedUser = {
      email: 'mehh@example.com',
      organizationMemberships: [
        {
          organization: {
            name: 'some-org',
            subscription: {
              status: 'paid'
            }
          }
        }
      ],
      sys: {
        id: 2
      }
    };

    this.user$ = K.createMockProperty();
    this.mockService('services/TokenStore', {
      user$: this.user$
    });

    this.envId = this.$inject('Config').launchDarkly.envId;

    this.getValue = K.getValue;

    const launchDarkly = this.$inject('utils/LaunchDarkly');
    launchDarkly.init(); // init LD before every spec

    this.getTest = launchDarkly.getTest;
    this.getFeatureFlag = launchDarkly.getFeatureFlag;
    this.setOnScope = launchDarkly.setOnScope;

    this.assertPropVal = K.assertCurrentValue;

    this.setSubscription = function (value) {
      this.user.organizationMemberships[0].organization.subscription.status = value;
    };

    this.update = function () {
      this.user$.set(this.user);
      this.$apply();
    };
  });

  afterEach(() => {
    client.on.reset();
    client.identify.reset();
  });

  describe('#init()', function () {
    it('should call launch darkly client initialize with anon user and bootstrap it', function () {
      sinon.assert.calledWithExactly(
        LD.initialize,
        this.envId,
        { key: 'anonymous-user', anonymous: true },
        { bootstrap: 'localStorage' }
      );
    });

    it('should change user context when the user is available', function () {
      sinon.assert.notCalled(client.identify);
      this.update();
      sinon.assert.calledOnce(client.identify);
      expect(client.identify.getCall(0).args[0].key).toEqual(this.user.sys.id);
    });

    it('should set `isNonPayingUser` flag for LD', function () {
      sinon.assert.notCalled(client.identify);

      this.setSubscription('paid');
      this.update();
      expect(client.identify.getCall(0).args[0].custom.isNonPayingUser).toEqual(false);

      this.setSubscription('free_paid');
      this.update();
      expect(client.identify.getCall(1).args[0].custom.isNonPayingUser).toEqual(false);

      this.setSubscription('free');
      this.update();
      expect(client.identify.getCall(2).args[0].custom.isNonPayingUser).toEqual(true);
    });

    it('should not change from anon user if user is not valid', function () {
      this.user = {};
      this.update();
      sinon.assert.notCalled(client.identify);
    });
  });

  describe('#getTest(testName, customQualificationFn)', function () {
    describe('for a qualified user', function () {
      beforeEach(function () {
        this.user$.set(this.user);
      });

      it('should return a kefir property that has the initial value of the flag', function () {
        client.variation.returns('initial-val');
        const propA = this.getTest('a');

        expect(this.getValue(propA)).toBe('initial-val');
      });

      it('should set the property returned to new value when value of the test changes', function () {
        const propA = this.getTest('a');

        client.variation.returns('one');
        this.assertPropVal(propA, 'one');

        client.on.withArgs('change:a');
        client.variation.returns('two');
        this.assertPropVal(propA, 'two');
      });
    });

    describe('for an unqualified user', function () {
      it('should return a kefir property that has null as the value for an unqualified user', function () {
        this.user$.set(this.unqualifiedUser);
        const propA = this.getTest('a');

        client.variation.returns('one');
        this.assertPropVal(propA, null);
      });
    });

    describe('for a transition from unqualified to qualified user', function () {
      it('should return null and then the actual test value', function () {
        this.user$.set(this.unqualifiedUser);

        const propA = this.getTest('a');

        client.variation.returns('dude');
        this.assertPropVal(propA, null);

        this.user$.set(this.user);
        this.assertPropVal(propA, 'dude');
      });
    });

    describe('when a custom qualification function is provided', function () {
      beforeEach(function () {
        client.variation.returns('test');
        this.user$.set(this.user);
      });

      it('should get current user as an argument', function () {
        const propA = this.getTest('a', user => {
          return user.organizationMemberships[0].organization.subscription.status === 'paid';
        });
        this.assertPropVal(propA, null);
      });

      it('should qualify/disqualify the user based on it in addition to default qualification criteria', function () {
        let propA = this.getTest('a', _ => false);
        this.assertPropVal(propA, null);

        propA = this.getTest('a', _ => true);
        this.assertPropVal(propA, 'test');
      });

      it('should default to a function that returns true', function () {
        this.assertPropVal(this.getTest('a'), 'test');
      });
    });
  });

  describe('#getFeatureFlag(testName)', function () {
    it('should return a kefir property that has the initial value of the flag', function () {
      client.variation.returns('initial-val');
      const propA = this.getFeatureFlag('a');

      expect(this.getValue(propA)).toBe('initial-val');
    });

    it('should set the property returned to new value when value of the test changes', function () {
      const propA = this.getFeatureFlag('a');

      client.variation.returns('one');
      this.assertPropVal(propA, 'one');

      client.on.withArgs('change:a');
      client.variation.returns('two');
      this.assertPropVal(propA, 'two');
    });

    it('should have property value for unqualified users', function () {
      this.user$.set(this.unqualifiedUser);
      client.variation.returns('test-val');
      const propA = this.getFeatureFlag('a');
      this.assertPropVal(propA, 'test-val');
    });

  });

  describe('#setOnScope($scope, testName)', function () {
    beforeEach(function () {
      const $rootScope = this.$inject('$rootScope');
      this.$scope = $rootScope.$new();
      client.variation.returns('some-val');
    });

    it('should set scope property for feature flag', function () {
      this.setOnScope(this.$scope, 'foo-bar', 'fooBar');
      expect(this.$scope.fooBar).toBe('some-val');
    });
  });
});
