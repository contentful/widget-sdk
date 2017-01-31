'use strict';

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

    const K = this.$inject('mocks/kefir');

    this.qualifiedUser = {
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

    this.user$ = K.createMockProperty();
    this.mockService('tokenStore', {
      user$: this.user$
    });

    this.envId = this.$inject('Config').launchDarkly.envId;

    this.getValue = K.getValue;

    const launchDarkly = this.$inject('utils/LaunchDarkly');
    launchDarkly.init(); // init LD before every spec

    this.get = launchDarkly.get;

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
        key: this.qualifiedUser.email,
        firstName: this.qualifiedUser.firstName,
        lastName: this.qualifiedUser.lastName,
        email: this.qualifiedUser.email,
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
        key: 'anonymous-user',
        anonymous: true
      });
      this.assertContextChange(assertNoSwitchOccured, 'free_paid');
      this.assertContextChange(assertNoSwitchOccured, 'paid');
    });
  });

  describe('#get(testName)', function () {
    beforeEach(function () {
      this.unqualifiedUser = {
        email: 'mehh@example.com',
        firstName: 'Unqualified',
        lastName: 'User',
        organizationMemberships: [
          {
            organization: {
              name: 'some-org',
              subscription: {
                status: 'paid'
              }
            }
          }
        ]
      };
    });

    describe('for a qualified user', function () {
      beforeEach(function () {
        this.user$.set(this.qualifiedUser);
      });

      it('should return a kefir property that has the initial value of the flag', function () {
        client.variation.returns('initial-val');
        const propA = this.get('a');

        expect(this.getValue(propA)).toBe('initial-val');
      });

      it('should set the property returned to new value when value of the test changes', function () {
        const propA = this.get('a');

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
        const propA = this.get('a');

        client.variation.returns('one');
        this.assertPropVal(propA, null);
      });
    });

    describe('for a transition from unqualified to qualified user', function () {
      it('should return null and then the actual test value', function () {
        this.user$.set(this.unqualifiedUser);

        const propA = this.get('a');

        client.variation.returns('dude');
        this.assertPropVal(propA, null);

        this.user$.set(this.qualifiedUser);
        this.assertPropVal(propA, 'dude');
      });
    });
  });
});
