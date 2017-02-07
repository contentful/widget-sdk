'use strict';

describe('utils/LaunchDarkly', function () {
  // mocks
  const client = {
    on: sinon.stub(),
    identify: sinon.stub(),
    variation: sinon.stub()
  };

  const LD = {
    initialize: sinon.stub().returns(client)
  };

  const $scope = {
    $on: sinon.stub()
  };

  const tokenStore = {
    user$: null
  };

  beforeEach(function () {
    module('cf.utils', 'contentful/test', $provide => {
      $provide.constant('libs/launch-darkly-client', LD);
      $provide.value('tokenStore', tokenStore);
    });

    const K = this.$inject('utils/kefir');

    this.envId = this.$inject('environment').settings.launchDarkly.envId;

    this.getValue = K.getValue;

    this.userPropBus$ = K.createPropertyBus(null);
    tokenStore.user$ = this.userPropBus$.property;

    const launchDarkly = this.$inject('utils/LaunchDarkly');
    launchDarkly.init('anon'); // init LD before every spec

    this.get = launchDarkly.get($scope);

    this.assertPropVal = function (prop, val) {
      expect(this.getValue(prop)).toBe(val);
    };
  });

  afterEach(() => {
    client.on.reset();
    client.identify.reset();
  });

  describe('#init()', function () {
    beforeEach(function () {
      this.user = {
        email: 'user@example.com',
        firstName: 'First',
        lastName: 'Last',
        organizationMemberships: [
          {
            organization: {
              name: 'test-org',
              subscription: {
                status: 'free'
              }
            }
          }
        ]
      };

      this.assertContextChange = function (assertion, status) {
        if (status) {
          this.user.organizationMemberships[0].organization.subscription = {
            status
          };
        }

        this.userPropBus$.set(this.user);
        this.$apply();

        assertion();
      };
    });

    it('should call launch darkly client initialize with anon user and bootstrap it', function () {
      sinon.assert.calledWithExactly(
        LD.initialize,
        this.envId,
        { key: 'anon', anonymous: true },
        { bootstrap: 'localStorage' }
      );
    });

    it('should change user context when a logged in and qualified user is available', function () {
      const ldUser = {
        key: this.user.email,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        custom: {
          organizationNames: ['test-org'],
          organizationSubscriptions: ['free']
        }
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
        key: 'anon',
        anonymous: true
      });
      this.assertContextChange(assertNoSwitchOccured, 'free_paid');
      this.assertContextChange(assertNoSwitchOccured, 'paid');
    });

    it('should set prop buses for all previously requested feature flags with their latest value', function () {
      const readyCb = client.on.args[0][1];

      client.variation.returns('not-init-yet');

      const props = [this.get('a'), this.get('b')];

      props.forEach(prop => this.assertPropVal(prop, 'not-init-yet'));

      client.variation.returns('ready');
      readyCb();

      props.forEach(prop => this.assertPropVal(prop, 'ready'));
    });
  });

  describe('#get($scope, featureFlag)', function () {
    it('should return a kefir property that has the initial value of the flag', function () {
      client.variation.returns('initial-val');
      const propA = this.get('a');

      expect(this.getValue(propA)).toBe('initial-val');
    });

    it('should set the property returned to new value when value of the feature flag changes', function () {
      client.variation.returns('one');

      const propA = this.get('a');
      const changeHandler = client.on.args[1][1];

      this.assertPropVal(propA, 'one');
      changeHandler('two');
      this.assertPropVal(propA, 'two');
    });
  });
});
