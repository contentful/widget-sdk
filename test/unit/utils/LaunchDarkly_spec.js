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
  });

  describe('#init()', function () {
    it('should call launch darkly client initialize with anon user and bootstrap it', function () {
      sinon.assert.calledWithExactly(
        LD.initialize,
        this.envId,
        { key: 'anon', anonymous: true },
        { bootstrap: 'localStorage' }
      );
    });

    it('should change user context when a logged in user is available', function () {
      const user = {
        email: 'user@example.com'
      };

      sinon.assert.notCalled(client.identify);

      this.userPropBus$.set(user);
      this.$apply();

      sinon.assert.calledWith(client.identify, {
        key: user.email
      });
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
