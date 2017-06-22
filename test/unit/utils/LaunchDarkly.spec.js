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

    this.qualifiedUser = {
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
  });

  afterEach(() => {
    client.on.reset();
    client.identify.reset();
  });

  describe('#init()', function () {
    beforeEach(function () {
      this.assertContextChange = function (assertion, status) {
        if (status) {
          this.qualifiedUser.organizationMemberships[0].organization.subscription = {
            status
          };
        }

        this.user$.set(this.qualifiedUser);
        this.$apply();

        assertion();
      };
    });

    it('should call launch darkly client initialize with anon user and bootstrap it', function () {
      sinon.assert.calledWithExactly(
        LD.initialize,
        this.envId,
        { key: 'anonymous-user', anonymous: true },
        { bootstrap: 'localStorage' }
      );
    });

    it('should change user context when a logged in and qualified user is available', function () {
      const ldUser = {
        key: this.qualifiedUser.sys.id
      };
      const assertSwitchedToUser = () => sinon.assert.calledWith(client.identify, ldUser);
      const assertSwitchedOnlyOnce = () => sinon.assert.calledOnce(client.identify);

      sinon.assert.notCalled(client.identify);
      this.assertContextChange(assertSwitchedToUser);
      // paid users don't qualify for tests
      this.assertContextChange(assertSwitchedOnlyOnce, 'paid');
    });

    it('should not change from anon user if user is not valid or qualified', function () {
      const assertNoSwitchOccured = () => sinon.assert.notCalled(client.identify);

      client.identify.reset();
      sinon.assert.calledWith(LD.initialize, this.envId, {
        key: 'anonymous-user',
        anonymous: true
      });
      this.assertContextChange(assertNoSwitchOccured, 'free_paid');
      this.assertContextChange(assertNoSwitchOccured, 'paid');
    });
  });

  describe('#getTest(testName, customQualificationFn)', function () {
    describe('for a qualified user', function () {
      beforeEach(function () {
        this.user$.set(this.qualifiedUser);
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

        this.user$.set(this.qualifiedUser);
        this.assertPropVal(propA, 'dude');
      });
    });

    describe('when a custom qualification function is provided', function () {
      beforeEach(function () {
        client.variation.returns('test');
        this.user$.set(this.qualifiedUser);
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
      this.setOnScope(this.$scope, 'feature-xx-00-00-foo-bar');
      expect(this.$scope.fooBar).toBe('some-val');
    });

    it('should set scope property for A/B test for qualified user', function () {
      this.user$.set(this.qualifiedUser);
      this.setOnScope(this.$scope, 'test-xx-00-00-foo-bar');
      expect(this.$scope.fooBar).toBe('some-val');
    });
  });
});
