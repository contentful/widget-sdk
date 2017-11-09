import * as K from 'helpers/mocks/kefir';
import * as sinon from 'helpers/sinon';
import moment from 'npm:moment';
import { update, push } from 'utils/Collections';

describe('LaunchDarkly', function () {
  beforeEach(function () {
    const $apply = this.$apply.bind(this);

    // This is a mock implementation of the LaunchDarkly client
    // library.
    this.client = {
      _eventHandlers: {},
      on: sinon.spy(function (event, handler) {
        this._eventHandlers = update(this._eventHandlers, event, (handlers) => {
          return push(handlers || [], handler);
        });
      }),
      _emit (event, value) {
        const handlers = this._eventHandlers[event] || [];
        handlers.forEach((handler) => handler(value));
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
      subscription: {status: 'free'},
      sys: {id: 1},
      subscriptionPlan: { name: 'Best Enterprise 2017' }
    };

    this.user = {
      email: 'a',
      organizationMemberships: [this.org],
      signInCount: 10,
      sys: {
        createdAt: moment().subtract(7, 'days').toISOString(),
        id: 'user-id-1'
      }
    };

    this.altOrg = {
      name: 'alternate org',
      role: 'member',
      subscription: {status: 'free_paid'},
      sys: {id: 2}
    };

    this.altUser = {
      email: 'b',
      organizationMemberships: [this.org],
      sys: {
        createdAt: moment().subtract(7, 'days').toISOString(),
        id: 'user-id-1'
      }
    };

    const userModule = {
      userDataBus$: K.createMockProperty([
        this.user,
        this.org,
        {}
      ]),
      getOrgRole: sinon.stub().returns('org role'),
      getUserAgeInDays: sinon.stub().returns(7),
      isNonPayingUser: sinon.stub().returns(true),
      hasAnOrgWithSpaces: sinon.stub().returns(false),
      ownsAtleastOneOrg: sinon.stub().returns(true),
      isAutomationTestUser: sinon.stub().returns(true),
      isUserOrgCreator: sinon.stub().returns(false)
    };

    this.shallowObjectDiff = {default: sinon.stub().returns({})};

    this.EnforceFlags = {getEnabledFlags: sinon.stub().returns([])};

    module('contentful/test', $provide => {
      $provide.constant('libs/launch-darkly-client', this.LD);
      $provide.value('data/User', userModule);
      $provide.value('utils/ShallowObjectDiff', this.shallowObjectDiff);
      $provide.value('utils/LaunchDarkly/EnforceFlags', this.EnforceFlags);
    });

    const ld = this.$inject('utils/LaunchDarkly');

    this.ld = ld;
    this.ld.init();

    this.setUserDataStream = function (user, org, spacesByOrg) {
      userModule.userDataBus$.set([user, org, spacesByOrg]);
      this.$apply();
    };
  });

  describe('#init()', function () {
    describe('initialize()', function () {
      it('should initialize ld client only once', function () {
        sinon.assert.calledOnce(this.LD.initialize);
        this.setUserDataStream(this.altUser, this.altOrg, {});
        sinon.assert.calledOnce(this.LD.initialize);
      });
    });
    describe('identify', function () {
      it('should identify new user if already initialized', function () {
        sinon.assert.notCalled(this.client.identify);
        this.setUserDataStream(this.altUser, this.altOrg, {});
        sinon.assert.calledOnce(this.client.identify);
      });
      it('should add custom data to the user object', function () {
        sinon.assert.notCalled(this.client.identify);
        this.setUserDataStream(this.user, this.org, {});

        const customData = this.client.identify.args[0][0].custom;
        expect(customData).toEqual({
          currentOrgId: this.org.sys.id,
          currentOrgSubscriptionStatus: this.org.subscription.status,
          currentOrgPlanIsEnterprise: true,
          currentOrgHasSpace: false,
          currentUserOrgRole: 'org role',
          currentUserHasAtleastOneSpace: false,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          isNonPayingUser: true,
          isAutomationTestUser: true,
          currentUserIsCurrentOrgCreator: false,
          currentUserSignInCount: 10
        });
      });
    });
  });

  describe('#getCurrentVariation', function () {
    it('should return a promise which resolves with variation after LD initializes', function* () {
      this.client.variation.withArgs('FLAG').returns('true');
      const variationPromise = this.ld.getCurrentVariation('FLAG');

      this.client._emit('ready');
      expect(yield variationPromise).toEqual(true);
    });

    it('should return a promise which resolves with variation after LD context changes', function* () {
      this.client.variation.withArgs('FLAG').returns('"potato"');
      const variationPromise = this.ld.getCurrentVariation('FLAG');

      this.setUserDataStream(this.user, this.org, {}, {sys: {id: 'space-id-999'}});
      this.client.identify.callArg(2); // invoke the callback passed to client.identify
      expect(yield variationPromise).toEqual('potato');
    });

    it('should return a promise which rejects for non-existing test/feature flag after LD initializes', function* () {
      this.client.variation.callsFake((_flag, defaultValue) => defaultValue);
      const variationPromise = this.ld.getCurrentVariation('FLAG');

      this.client._emit('ready');
      const error = yield variationPromise.catch((e) => e);
      expect(error).toEqual(new Error('Invalid flag FLAG'));
    });
  });

  describe('#onFeatureFlag', function () {
    beforeEach(function () {
      this.$scope = this.$inject('$rootScope').$new();

      this.ld.onFeatureFlag(this.$scope, 'FLAG', (value, change) => {
        this.$scope.flagValue = value;
        this.$scope.flagChange = change;
      });
    });

    it('should attach a handler for flag variations and changes', function () {
      this.client.variation.returns('true');
      this.client._emit('ready');
      expect(this.$scope.flagValue).toBe(true);

      const diff = {a: 10};
      this.shallowObjectDiff.default.returns(diff);
      this.client.variation.returns('null');

      this.client._emit('change:FLAG');
      expect(this.$scope.flagValue).toBe(null);
      expect(this.$scope.flagChange).toBe(diff);
    });

    it('should track variation changes by default', function () {
      this.client._emit('ready');

      const diff = {a: true, b: 'test'};
      this.shallowObjectDiff.default.returns(diff);
      this.client.variation.returns('1');
      this.client._emit('change:FLAG');
      expect(this.$scope.flagValue).toBe(1);
      expect(this.$scope.flagChange).toBe(diff);
    });

    it('should remove change handler when scope is destroyed', function () {
      this.client._emit('ready');
      const changeHandler = this.client.on.args[1][1];
      this.$scope.$destroy();
      expect(this.client.off.args[0][1]).toBe(changeHandler);
    });

    it('should never call the variation handler with undefined', function () {
      this.client._emit('ready');
      const spy = sinon.spy();

      this.client.variation.returns(undefined);
      this.ld.onFeatureFlag(this.$scope, 'feature-flag', spy);

      sinon.assert.notCalled(spy);
    });

    it('should not attach a change handler until LD is initialized with current context', function () {
      sinon.assert.callCount(this.client.on.withArgs('change:FLAG'), 0);
      this.client._emit('ready');
      sinon.assert.callCount(this.client.on.withArgs('change:FLAG'), 1);
    });

    it('overrides value with true for enforced feature flags', function () {
      this.client._emit('ready');
      this.EnforceFlags.getEnabledFlags.returns(['FLAG']);
      this.client.variation.withArgs('FLAG').returns('false');
      this.client._emit('change:FLAG');
      expect(this.$scope.flagValue).toBe(true);
    });
  });
});
