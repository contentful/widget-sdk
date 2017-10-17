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
      subscription: {status: 'free'}, sys: {id: 1}
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
      userDataStream$: K.createMockProperty([
        this.user,
        this.org,
        {}
      ]),
      getOrgRole: sinon.stub().returns('org role'),
      getUserAgeInDays: sinon.stub().returns(7),
      isNonPayingUser: sinon.stub().returns(true),
      hasAnOrgWithSpaces: sinon.stub().returns(false),
      ownsAtleastOneOrg: sinon.stub().returns(true)
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
    this.onABTest = ld.onABTest;
    this.setUserDataStream = function (user = this.user, org = this.org, spacesByOrg = {}, space) {
      this.utils.userDataStream$.set([user, org, spacesByOrg, space]);
      this.$apply();
    };
    this.setupFF = function (methodName = 'onFeatureFlag', initVal = 'true', ignoreChangeFn) {
      const $scope = this.rootScope.$new();
      const spy = sinon.spy();

      this.client.variation.returns(initVal);
      this[methodName]($scope, 'feature-flag', spy, ignoreChangeFn);

      const readyHandler = this.client.on.args[0][1];
      const changeHandler = this.client.on.args[1][1];

      return { $scope, spy, readyHandler, changeHandler };
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
          currentOrgHasSpace: false,
          currentUserOrgRole: 'org role',
          currentUserHasAtleastOneSpace: false,
          currentUserOwnsAtleastOneOrg: true,
          currentUserAge: 7,
          isNonPayingUser: true
        });
      });
    });
  });

  describe('#onFeatureFlag', function () {
    it('should attach a handler for flag variations', function () {
      const { spy, readyHandler, changeHandler } = this.setupFF();
      expect(spy.args[0][0]).toBe(true);

      this.client.variation.returns('false');
      readyHandler();
      expect(spy.args[1][0]).toBe(false);

      this.client.variation.returns('null');
      changeHandler();
      expect(spy.args[2][0]).toBe(null);
    });
    it('should track variation changes by default', function () {
      const { spy, changeHandler } = this.setupFF();
      this.client.variation.returns('1');
      changeHandler();
      expect(spy.args[1][0]).toBe(1);
    });

    commonTests('onFeatureFlag');
  });

  describe('#onABTest', function () {
    it('should attach a handler for flag variations', function () {
      const { spy, readyHandler, changeHandler } = this.setupFF('onABTest', '"potato"');
      expect(spy.args[0][0]).toBe('potato');

      this.client.variation.returns('false');
      readyHandler();
      expect(spy.args[1][0]).toBe(false);

      this.client.variation.returns('null');
      changeHandler();
      sinon.assert.calledTwice(spy);
    });
    it('should not track variation changes by default', function () {
      const { spy, changeHandler } = this.setupFF('onABTest');
      this.client.variation.returns('1');
      changeHandler();
      sinon.assert.calledOnce(spy);
    });
    commonTests('onABTest');
  });


  function commonTests (methodName) {
    it('should remove ready and change handlers when scope is destroyed', function () {
      const { $scope, readyHandler, changeHandler } = this.setupFF(methodName);
      $scope.$destroy();
      expect(this.client.off.args[0][1]).toBe(readyHandler);
      expect(this.client.off.args[1][1]).toBe(changeHandler);
    });
    it('should never call the variation handler with undefined', function () {
      const $scope = this.rootScope.$new();
      const spy = sinon.spy();

      this.client.variation.returns(undefined);
      this.onFeatureFlag($scope, 'feature-flag', spy);

      sinon.assert.notCalled(spy);
    });
    it('should accept an ignoreChangeFn which decides if variation changes are tracked or not', function () {
      const ignoreChangeFn = sinon.stub().returns(true);
      const { spy, changeHandler } = this.setupFF(methodName, 'false', ignoreChangeFn);

      this.client.variation.returns('null');
      changeHandler('null', 'true');
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWithExactly(spy, false);
    });
    describe('ignoreChangeFn', function () {
      it('should receive changes in context, new and old variations as arguments', function () {
        const ignoreChangeFn = sinon.stub().returns(true);
        const { changeHandler } = this.setupFF(methodName, 'false', ignoreChangeFn);

        this.client.variation.returns('null');
        changeHandler('null', 'true');
        sinon.assert.calledOnce(ignoreChangeFn);
        // changes are {} since getChangesObject is stubbed in beforEach
        sinon.assert.calledWithExactly(ignoreChangeFn, {}, null, true);
      });
    });
  }
});
