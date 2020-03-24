import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import { $initialize, $inject, $apply, $applyAsync } from 'test/utils/ng';

describe('Client Controller', () => {
  let scope;

  afterEach(() => {
    scope = null;
  });

  beforeEach(async function () {
    this.getEnforcements = sinon.stub();
    this.newUsageChecker = sinon.stub();
    this.logger = {
      enable: sinon.stub(),
      disable: sinon.stub(),
      logError: sinon.stub(),
    };
    this.isAnalyticsAllowed = sinon.stub().returns(true);
    this.getSpaceFeature = sinon.stub();

    this.authorizationStubs = {
      update: sinon.stub(),
      authContext: {
        hasSpace: sinon.stub(),
      },
    };

    this.pubSubOn = sinon.stub();
    this.pubSubOff = sinon.stub();

    this.stubs = {
      refresh: sinon.stub().resolves(),
      user$: K.createMockProperty(),
      getTokenLookup: sinon.stub().returns({}),
      enable: sinon.stub(),
      disable: sinon.stub(),
      track: sinon.stub(),
      intercomDisable: sinon.stub(),
      pubsubClient: { on: this.pubSubOn, off: this.pubSubOn },
      initOsano: sinon.stub(),
    };

    this.system.set('services/OsanoService', {
      init: this.stubs.initOsano,
    });

    this.system.set('analytics/Analytics', {
      enable: this.stubs.enable,
      disable: this.stubs.disable,
      track: this.stubs.track,
    });

    this.system.set('data/CMA/ProductCatalog', {
      getSpaceFeature: this.getSpaceFeature,
    });

    this.system.set('services/EnforcementsService', {
      getEnforcements: this.getEnforcements,
      newUsageChecker: this.newUsageChecker,
    });
    this.system.set('services/EnforcementsService', {
      newUsageChecker: this.newUsageChecker,
      getEnforcements: this.getEnforcements,
    });
    this.system.set('analytics/isAnalyticsAllowed', {
      default: this.isAnalyticsAllowed,
    });
    this.system.set('services/logger', this.logger);
    this.system.set('services/TokenStore', {
      refresh: this.stubs.refresh,
      user$: this.stubs.user$,
      getTokenLookup: this.stubs.getTokenLookup,
    });

    this.system.set('services/intercom', {
      disable: this.stubs.intercomDisable,
    });

    this.refreshNavState = sinon.stub();
    this.system.set('navigation/NavState', {
      makeStateRefresher: () => this.refreshNavState,
    });

    this.system.set('services/authorization', {
      default: this.authorizationStubs,
    });

    this.ENVIRONMENT_ALIAS_CHANGED_EVENT = 'ENVIRONMENT_ALIAS_CHANGED_EVENT';

    this.system.set('services/PubSubService', {
      createPubSubClientForSpace: this.stubs.createPubSubClientForSpace,
      ENVIRONMENT_ALIAS_CHANGED_EVENT: this.ENVIRONMENT_ALIAS_CHANGED_EVENT,
    });

    this.system.set('app/SpaceSettings/EnvironmentAliases/NotificationsService', {
      default: sinon.stub().returns(sinon.stub()),
    });

    await $initialize(this.system);

    const $rootScope = $inject('$rootScope');
    scope = $rootScope.$new();
    $inject('$controller')('ClientController', { $scope: scope });

    const waitForControllerInitialization = async () => {
      if (scope.controllerReady) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      return waitForControllerInitialization();
    };

    await waitForControllerInitialization();
  });

  describe('updates authorization data', () => {
    beforeEach(function () {
      this.token = { sys: {} };
      this.enforcements = [];
      this.newEnforcement = {};

      this.envId = 'ENV ID';
      this.spaceId = 'Space ID';
      this.getSpaceFeature = this.getSpaceFeature.withArgs(this.spaceId, 'flag').resolves(false);
      this.newUsageChecker.withArgs(1, 2).resolves(this.newEnforcement);

      this.spaceContext = $inject('spaceContext');
      this.spaceContext.getEnvironmentId = () => this.envId;
      this.spaceContext.isMasterEnvironment = () => this.envId === 'master';
      this.spaceContext.getId = () => this.spaceId;
      this.spaceContext.space = null;
      this.stubs.getTokenLookup.returns(this.token);
      this.getEnforcements.returns(this.enforcements);
      $apply();
    });

    it('initializes authorization with correct data', function () {
      sinon.assert.calledWith(
        this.authorizationStubs.update,
        this.token,
        this.spaceContext.space,
        this.enforcements,
        this.envId,
        this.spaceContext.isMasterEnvironment(),
        this.newEnforcement
      );
    });

    it('on tokenLookup update', function () {
      const newToken = { sys: {} };
      this.stubs.getTokenLookup.returns(newToken);
      $apply();

      sinon.assert.calledWith(this.authorizationStubs.update.secondCall, newToken);
    });

    it('on spaceContext.space update', async function () {
      const space = {
        getId: () => 'SPACE ID',
      };
      this.spaceContext.space = space;
      $apply();
      await new Promise((resolve) => setTimeout(resolve, 0));

      sinon.assert.calledWith(
        this.authorizationStubs.update,
        sinon.match.any,
        this.spaceContext.space
      );
    });

    it('on enforcements update', async function () {
      $apply();

      const enforcements = [{ sys: { id: 'E_1' } }];
      this.getEnforcements.returns(enforcements);

      $apply();
      await new Promise((resolve) => setTimeout(resolve, 0));

      sinon.assert.calledWith(
        this.authorizationStubs.update,
        sinon.match.any,
        sinon.match.any,
        enforcements
      );
    });

    it('updates nav state', function () {
      $apply();
      sinon.assert.called(this.refreshNavState);
    });
  });

  describe('initializes client', () => {
    beforeEach(function () {
      this.user = { sys: {} };
      this.stubs.user$.set(this.user);
      scope.$digest();
    });

    it('sets user', function () {
      expect(scope.user).toEqual(this.user);
    });
  });

  describe('organizations on the scope', () => {
    describe('if user exists', () => {
      let user, org1, org2, org3;
      beforeEach(function () {
        org1 = { org1: true };
        org2 = { org2: true };
        org3 = { org3: true };
        user = {
          organizationMemberships: [
            { organization: org1 },
            { organization: org2 },
            { organization: org3 },
          ],
        };

        this.prepare = function () {
          this.stubs.user$.set(user);
        };
      });

      it('enables logging and initializes the Osano service', function () {
        this.prepare();
        sinon.assert.called(this.stubs.initOsano);
        sinon.assert.calledWithExactly(this.logger.enable, user);
      });
    });
  });

  describe('pubsub subscription', () => {
    beforeEach(function () {
      this.token = { sys: {} };
      this.environmentId = 'Environment ID';
      this.spaceId = 'Space ID';
      this.spaceContext = $inject('spaceContext');
      this.spaceContext.hasOptedIntoAliases = () => true;
      this.spaceContext.getId = () => this.spaceId;
      this.spaceContext.space = null;
      this.spaceContext.getEnvironmentId = () => this.environmentId;
      this.spaceContext.isMasterEnvironment = () => true;
      this.spaceContext.pubsubClient = this.stubs.pubsubClient;
    });

    it('does not subscribe if no spaceId', async function () {
      this.spaceContext.getId = () => null;
      $apply();
      sinon.assert.notCalled(this.pubSubOn);
    });

    it('subscribes if spaceId', async function () {
      await $applyAsync();
      sinon.assert.calledWith(this.pubSubOn, this.ENVIRONMENT_ALIAS_CHANGED_EVENT, sinon.match.any);
    });
  });
});
