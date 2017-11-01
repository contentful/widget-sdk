import * as K from 'helpers/mocks/kefir';
import * as sinon from 'helpers/sinon';
import moment from 'npm:moment';

describe('LaunchDarkly', function () {
  beforeEach(function () {
    // mocks
    this.client = {
      on: sinon.stub(),
      off: sinon.stub(),
      identify: sinon.stub(),
      variation: sinon.stub()
    };

    this.LD = {
      initialize: sinon.stub().returns(this.client)
    };

    this.org = {
      name: 'org',
      role: 'owner',
      subscription: {status: 'free'}, sys: {id: 1},
      subscriptionPlan: { name: 'Best Enterprise 2017' }
    };

    this.user = {
      email: 'a',
      organizationMemberships: [this.org],
      sys: {
        createdAt: moment().subtract(7, 'days').toISOString(),
        id: 'user-id-1'
      }
    };

    this.altOrg = {
      name: 'alternate org',
      role: 'member',
      subscription: {status: 'free_paid'}, sys: {id: 2}
    };

    this.altUser = {
      email: 'b',
      organizationMemberships: [this.org],
      sys: {
        createdAt: moment().subtract(7, 'days').toISOString(),
        id: 'user-id-1'
      }
    };

    this.utils = {
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
      isAutomationTestUser: sinon.stub().returns(true)
    };

    this.shallowObjectDiff = {default: sinon.stub().returns({})};

    module('contentful/test', $provide => {
      $provide.constant('libs/launch-darkly-client', this.LD);
      $provide.value('data/User', this.utils);
      $provide.value('utils/ShallowObjectDiff', this.shallowObjectDiff);
    });

    const ld = this.$inject('utils/LaunchDarkly');

    this.init = ld.init;
    this.onFeatureFlag = ld.onFeatureFlag;
    this.onABTestOnce = ld.onABTestOnce;
    this.setUserDataStream = function (user = this.user, org = this.org, spacesByOrg = {}, space) {
      this.utils.userDataBus$.set([user, org, spacesByOrg, space]);
      this.$apply();
    };

    this.rootScope = this.$inject('$rootScope');
    this.init();
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
          isAutomationTestUser: true
        });
      });
    });
  });

  describe('#onABTestOnce', function () {
    beforeEach(function () {
      this.setupABOnce = function (initVal) {
        this.client.variation.returns(initVal);
        const variationPromise = this.onABTestOnce('test-name');

        const readyHandler = _ => {
          this.client.on.args[0][1](); // execute the callback for LD's 'ready' event
          this.$apply();
        };

        return { variationPromise, readyHandler };
      };
    });

    it('should return a promise which resolves with variation for test name after LD initializes', function* () {
      const { variationPromise, readyHandler } = this.setupABOnce('true');

      readyHandler(); // removing this line will hang the test as LD will not be initialized
      expect(yield variationPromise).toEqual(true);
    });

    it('should return a promise which rejects for non-existing test name after LD initializes', function* () {
      const { variationPromise, readyHandler } = this.setupABOnce('<UNINITIALIZED>');

      try {
        readyHandler(); // removing this line will hang the test as LD will not be initialized
        yield variationPromise;
      } catch (e) {
        expect(e).toEqual(new Error('Invalid test flag test-name'));
      }
    });
  });

  describe('#onFeatureFlag', function () {
    beforeEach(function () {
      this.setupFF = function () {
        const $scope = this.rootScope.$new();
        const spy = sinon.spy();

        this.client.variation.returns('true');
        this.onFeatureFlag($scope, 'feature-flag', spy);

        const readyHandler = _ => {
          this.client.on.args[0][1](); // execute the callback for LD's 'ready' event
          this.$apply();
        };

        readyHandler();

        return {
          $scope,
          spy,
          getChangeHandler: _ => this.client.on.args[1][1] // callback for LD's client.on('change:flag-name`) event
        };
      };
    });

    it('should attach a handler for flag variations and changes', function () {
      const { spy, getChangeHandler } = this.setupFF();
      const changeHandler = getChangeHandler();
      const diff = {a: 10};

      // init val triggered when ld is ready
      expect(spy.args[0][0]).toBe(true);

      this.shallowObjectDiff.default.returns(diff);
      this.client.variation.returns('null');
      changeHandler();
      expect(spy.args[1][0]).toBe(null);
      expect(spy.args[1][1]).toBe(diff);
    });

    it('should track variation changes by default', function () {
      const { spy, getChangeHandler } = this.setupFF();
      const changeHandler = getChangeHandler();
      const diff = {a: true, b: 'test'};

      this.shallowObjectDiff.default.returns(diff);
      this.client.variation.returns('1');
      changeHandler();
      expect(spy.args[1][0]).toBe(1);
      expect(spy.args[1][1]).toBe(diff);
    });

    it('should remove change handler when scope is destroyed', function () {
      const { $scope, getChangeHandler } = this.setupFF();
      const changeHandler = getChangeHandler();

      $scope.$destroy();
      expect(this.client.off.args[0][1]).toBe(changeHandler);
    });

    it('should never call the variation handler with undefined', function () {
      const $scope = this.rootScope.$new();
      const spy = sinon.spy();

      this.client.variation.returns(undefined);
      this.onFeatureFlag($scope, 'feature-flag', spy);

      sinon.assert.notCalled(spy);
    });

    it('should not attach a change handler until LD is initialized with current context', function () {
      const $scope = this.rootScope.$new();
      const spy = sinon.spy();

      this.client.variation.returns('false');
      this.onFeatureFlag($scope, 'feature-flag', spy);

      const readyHandler = _ => {
        this.client.on.args[0][1]();
        this.$apply();
      };
      const getChangeHandler = _ => this.client.on.args[1][1];

      expect(_ => getChangeHandler()).toThrow();
      readyHandler();
      expect(typeof getChangeHandler()).toBe('function');
    });
  });
});
