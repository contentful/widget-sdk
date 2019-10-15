import * as K from 'test/utils/kefir';
import sinon from 'sinon';
import moment from 'moment';
import { update, push } from 'utils/Collections.es6';

xdescribe('LaunchDarkly', () => {
  beforeEach(function() {
    const $apply = this.$apply.bind(this);

    // This is a mock implementation of the LaunchDarkly client
    // library.
    this.client = {
      _eventHandlers: {},
      on: sinon.spy(function(event, handler) {
        this._eventHandlers = update(this._eventHandlers, event, handlers => {
          return push(handlers || [], handler);
        });
      }),
      _emit(event, value) {
        const handlers = this._eventHandlers[event] || [];
        handlers.forEach(handler => handler(value));
        $apply();
      },
      off: sinon.spy(),
      identify: sinon.spy(),
      variation: sinon.stub()
    };

    this.LD = {
      initialize: sinon.stub().returns(this.client)
    };

    this.org = {
      name: 'org',
      role: 'owner',
      subscription: { status: 'free' },
      sys: { id: 1 },
      pricingVersion: `pricing_version_1`
    };

    this.user = {
      email: 'a',
      organizationMemberships: [this.org],
      signInCount: 10,
      sys: {
        createdAt: moment()
          .subtract(7, 'days')
          .toISOString(),
        id: 'user-id-1'
      }
    };

    this.altOrg = {
      name: 'alternate org',
      role: 'member',
      subscription: { status: 'free_paid' },
      sys: { id: 2 }
    };

    this.userDataBus$ = null;

    this.altUser = {
      email: 'b',
      organizationMemberships: [this.org],
      sys: {
        createdAt: moment()
          .subtract(7, 'days')
          .toISOString(),
        id: 'user-id-1'
      }
    };

    const userModule = {
      getUserDataBus: () => {
        this.userDataBus$ = K.createMockProperty([this.user, this.org, {}]);
        return this.userDataBus$;
      },
      getOrgRole: sinon.stub().returns('org role'),
      getUserAgeInDays: sinon.stub().returns(7),
      hasAnOrgWithSpaces: sinon.stub().returns(false),
      ownsAtleastOneOrg: sinon.stub().returns(true),
      isAutomationTestUser: sinon.stub().returns(true),
      isUserOrgCreator: sinon.stub().returns(false),
      getUserCreationDateUnixTimestamp: sinon.stub().returns(1234567890)
    };

    this.shallowObjectDiff = { default: sinon.stub().returns({}) };

    this.EnforceFlags = {
      isFlagOverridden: sinon.stub().returns(false),
      getFlagOverride: sinon.stub()
    };

    this.logger = { logError: sinon.stub() };

    module('contentful/test', $provide => {
      $provide.constant('ldclient-js', this.LD);
      $provide.value('data/User/index.es6', userModule);
      $provide.value('utils/ShallowObjectDiff.es6', this.shallowObjectDiff);
      $provide.value('debug/EnforceFlags.es6', this.EnforceFlags);
      $provide.constant('services/logger.es6', this.logger);
    });

    const ld = this.$inject('utils/LaunchDarkly/index.es6')._noMock;

    this.ld = ld;
    this.ld.init();

    // Emit ready on the client and wait until the LD service is ready
    // to use the client.
    this.ready = () => {
      this.client.variation.withArgs('dummy').returns('true');
      this.client._emit('ready');
      return this.ld.getCurrentVariation('dummy');
    };

    this.setUserDataStream = (user, org, spacesByOrg) => {
      this.userDataBus$.set([user, org, spacesByOrg]);
      this.$apply();
    };
  });

  describe('#init()', () => {
    describe('initialize()', () => {
      it('should initialize ld client only once', function() {
        sinon.assert.calledOnce(this.LD.initialize);
        this.setUserDataStream(this.altUser, this.altOrg, {});
        sinon.assert.calledOnce(this.LD.initialize);
      });
    });
    describe('identify', () => {
      it('should identify new user if already initialized', function() {
        sinon.assert.notCalled(this.client.identify);
        this.setUserDataStream(this.altUser, this.altOrg, {});
        sinon.assert.calledOnce(this.client.identify);
      });
      it('should add custom data to the user object', function() {
        sinon.assert.notCalled(this.client.identify);
        this.setUserDataStream(this.user, this.org, {});

        const customData = this.client.identify.args[0][0].custom;
        expect(customData).toEqual({
          currentOrgId: this.org.sys.id,
          currentOrgSubscriptionStatus: this.org.subscription.status,
          currentOrgPlanIsEnterprise: false,
          currentOrgHasSpace: false,
          currentOrgHasPaymentMethod: false,
          currentOrgPricingVersion: `pricing_version_1`,
          currentUserOrgRole: 'org role',
          currentUserCreationDate: 1234567890,
          currentUserHasAtleastOneSpace: false,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          isNonPayingUser: true,
          isAutomationTestUser: true,
          currentUserIsCurrentOrgCreator: false,
          currentUserSignInCount: 10,
          currentUserSpaceRole: []
        });
      });
    });
  });

  describe('#getCurrentVariation', () => {
    it('should return a promise which resolves with variation after LD initializes', function*() {
      this.client.variation.withArgs('FLAG').returns('true');
      const variationPromise = this.ld.getCurrentVariation('FLAG');

      this.client._emit('ready');
      expect(yield variationPromise).toEqual(true);
    });

    it('should return a promise which resolves with variation after LD context changes', function*() {
      this.client.variation.withArgs('FLAG').returns('"potato"');
      const variationPromise = this.ld.getCurrentVariation('FLAG');

      this.setUserDataStream(this.user, this.org, {}, { sys: { id: 'space-id-999' } });
      this.client.identify.callArg(2); // invoke the callback passed to client.identify
      expect(yield variationPromise).toEqual('potato');
    });

    it('should return a promise which resolves with undefined and log error for non-existing test/feature flag', function*() {
      this.client.variation.callsFake((_flag, defaultValue) => defaultValue);
      const variationPromise = this.ld.getCurrentVariation('FLAG');

      this.client._emit('ready');
      const variation = yield variationPromise;
      sinon.assert.calledOnce(this.logger.logError.withArgs('Invalid flag FLAG'));
      expect(variation).toBeUndefined();
    });

    it('should return the overriden value for an overriden flag and not use client.variation', async function() {
      this.EnforceFlags.isFlagOverridden.returns(true);
      this.EnforceFlags.getFlagOverride.returns('SOME VALUE');
      const variation = await this.ld.getCurrentVariation('FLAG');

      expect(variation).toBe('SOME VALUE');
      sinon.assert.notCalled(this.client.variation);
    });
  });

  describe('#onFeatureFlag', () => {
    beforeEach(function() {
      this.$scope = this.$inject('$rootScope').$new();

      this.ld.onFeatureFlag(this.$scope, 'FLAG', (value, change) => {
        this.$scope.flagValue = value;
        this.$scope.flagChange = change;
      });
    });

    it('should attach a handler for flag variations and changes', function*() {
      this.client.variation.returns('true');
      yield this.ready();
      expect(this.$scope.flagValue).toBe(true);

      const diff = { a: 10 };
      this.shallowObjectDiff.default.returns(diff);
      this.client.variation.returns('null');

      this.client._emit('change:FLAG');
      expect(this.$scope.flagValue).toBe(null);
      expect(this.$scope.flagChange).toBe(diff);
    });

    it('should track variation changes by default', function*() {
      yield this.ready();

      const diff = { a: true, b: 'test' };
      this.shallowObjectDiff.default.returns(diff);
      this.client.variation.returns('1');
      this.client._emit('change:FLAG');
      expect(this.$scope.flagValue).toBe(1);
      expect(this.$scope.flagChange).toBe(diff);
    });

    it('should remove change handler when scope is destroyed', function*() {
      yield this.ready();
      const changeHandler = this.client.on.args[1][1];
      this.$scope.$destroy();
      expect(this.client.off.args[0][1]).toBe(changeHandler);
    });

    it('should not filter undefined as the variation', function*() {
      const spy = sinon.spy();
      this.ld.onFeatureFlag(this.$scope, 'feature-flag', spy);
      this.client.variation.returns(undefined);
      yield this.ready();

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, undefined);
    });

    it('should not attach a change handler until LD is initialized with current context', function*() {
      sinon.assert.callCount(this.client.on.withArgs('change:FLAG'), 0);
      yield this.ready();
      sinon.assert.callCount(this.client.on.withArgs('change:FLAG'), 1);
    });

    it('should return the overriden value for an overriden flag and not use client.variation', function() {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      this.EnforceFlags.isFlagOverridden.returns(true);
      this.EnforceFlags.getFlagOverride.returns('SOME VALUE');

      this.ld.onFeatureFlag(this.$scope, 'SOME-FLAG', spy1);
      this.ld.onFeatureFlag(this.$scope, 'SOME-FLAG', spy2);

      // no need to await before asserts as in this scenario
      // nothing goes over the network, etc and hence it's completely
      // synchronous
      sinon.assert.calledOnce(spy1);
      sinon.assert.calledOnce(spy2);
      sinon.assert.calledWithExactly(spy1, 'SOME VALUE', {});
      sinon.assert.calledWithExactly(spy2, 'SOME VALUE', {});
      sinon.assert.notCalled(this.client.variation);
    });
  });
});