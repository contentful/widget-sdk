import * as K from 'helpers/mocks/kefir';

describe('Access Checker', function () {
  let enforcements, OrganizationRoles, TokenStore, policyChecker, ac;
  let getResStub, reasonsDeniedStub, broadcastStub, resetEnforcements, mockSpace, mockSpaceAuthContext, mockOrgEndpoint;

  function init () {
    ac.setAuthContext({authContext: {}, spaceAuthContext: mockSpaceAuthContext});
    ac.setSpace(mockSpace);
  }

  function triggerChange () {
    ac.setSpace(mockSpace);
  }

  function changeAuthContext (authContext) {
    ac.setAuthContext({authContext, spaceAuthContext: mockSpaceAuthContext});
  }

  afterEach(function () {
    enforcements = OrganizationRoles = policyChecker = ac = getResStub = reasonsDeniedStub = broadcastStub = null;
  });

  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.value('access_control/OrganizationMembershipRepository', {createEndpoint: () => mockOrgEndpoint});
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: sinon.stub().resolves(false)
      });
    });

    enforcements = this.$inject('access_control/Enforcements');
    OrganizationRoles = this.$inject('services/OrganizationRoles');
    TokenStore = this.$inject('services/TokenStore');
    policyChecker = this.$inject('access_control/AccessChecker/PolicyChecker');

    const acUtils = this.$inject('access_control/AccessChecker/Utils');
    acUtils.broadcastEnforcement = broadcastStub = sinon.stub();
    acUtils.resetEnforcements = resetEnforcements = sinon.stub();

    const responseCache = this.$inject('access_control/AccessChecker/ResponseCache');
    responseCache.getResponse = getResStub = sinon.stub().returns(false);

    reasonsDeniedStub = sinon.stub().returns([]);
    enforcements.determineEnforcement = sinon.stub().returns(undefined);

    mockSpace = {organization: {sys: {}}};
    mockSpaceAuthContext = {reasonsDenied: reasonsDeniedStub};
    mockOrgEndpoint = sinon.stub();

    ac = this.$inject('access_control/AccessChecker');
  });

  describe('Initialization', function () {
    it('sets isInitialized$ to false when authContext is null', function () {
      ac.setOrganization(null);
      ac.setAuthContext({authContext: null});
      expect(K.getValue(ac.isInitialized$)).toEqual(false);

      ac.setOrganization({sys: {}});
      expect(K.getValue(ac.isInitialized$)).toEqual(false);

      ac.setSpace(mockSpace);
      expect(K.getValue(ac.isInitialized$)).toEqual(false);
    });
    it('sets isInitialized$ to true when authContext is set', function () {
      ac.setAuthContext({authContext: {}});
      expect(K.getValue(ac.isInitialized$)).toEqual(true);
    });
    it('sets isInitialized$ to true when authContext, spaceAuthContext and space are set', function () {
      ac.setSpace(mockSpace);
      ac.setAuthContext({authContext: {}, spaceAuthContext: mockSpaceAuthContext});
      expect(K.getValue(ac.isInitialized$)).toEqual(true);
    });
  });

  describe('Access checker methods', function () {
    beforeEach(function () {
      init();
    });

    describe('#getResponses', function () {
      it('collects responses when auth context changes', function () {
        const responses = ac.getResponses();
        triggerChange();
        expect(ac.getResponses() === responses).toBe(false);
      });

      it('contains keys for entity actions', function () {
        const responses = ac.getResponses();
        const testKeys = ['createContentType', 'readEntry', 'updateAsset', 'createApiKey', 'updateSettings'];
        const intersection = _.intersection(_.keys(responses), testKeys);
        expect(intersection.length).toBe(testKeys.length);
      });

      it('should not hide or disable when operation can be performed', function () {
        getResStub.withArgs('read', 'Entry').returns(true);
        triggerChange();
        const response = ac.getResponses()['readEntry'];
        expect(response.can).toBe(true);
        expect(response.shouldHide).toBe(false);
        expect(response.shouldDisable).toBe(false);
      });

      it('should disable, but not hide when operation cannot be performed and reasons for denial are given', function () {
        reasonsDeniedStub.withArgs('read', 'Entry').returns(['DENIED!']);
        triggerChange();
        const response = ac.getResponses()['readEntry'];
        expect(response.can).toBe(false);
        expect(response.shouldHide).toBe(false);
        expect(response.shouldDisable).toBe(true);
        expect(_.first(response.reasons)).toBe('DENIED!');
      });

      it('should hide when operation cannot be performed and no reasons are given', function () {
        const response = ac.getResponses()['readEntry'];
        expect(response.can).toBe(false);
        expect(response.shouldHide).toBe(true);
        expect(response.shouldDisable).toBe(false);
        expect(response.reasons).toBe(null);
      });

      it('should reset the persistent notification', function () {
        sinon.assert.called(resetEnforcements);
      });

      it('should broadcast enforcement if found', function () {
        const reasons = ['DENIED!'];
        const enforcement = {message: 'ENFORCEMENT MSG'};
        reasonsDeniedStub.withArgs('read', 'Entry').returns(reasons);
        enforcements.determineEnforcement.withArgs(
          mockSpace.organization,
          reasons,
          'Entry'
        ).returns(enforcement);
        triggerChange();
        sinon.assert.calledOnce(broadcastStub.withArgs(enforcement));
      });
    });

    describe('#getResponseByActionName', function () {
      it('returns undefined for an unknown action', function () {
        expect(ac.getResponseByActionName('unknown')).toBe(undefined);
      });

      it('returns response for a known action', function () {
        const n = 'readEntry';
        const response = ac.getResponseByActionName(n);
        expect(response).toBe(ac.getResponses()[n]);
        expect(_.isObject(response) && response.can === false).toBe(true);
      });
    });

    describe('#getSectionVisibility', function () {
      it('changes when auth context changes', function () {
        const visibility = ac.getSectionVisibility();
        triggerChange();
        expect(ac.getSectionVisibility() === visibility).toBe(false);
      });

      it('checks if there is a "hide" flag for chosen actions', function () {
        function test (action, key, val) {
          const entity = key.charAt(0).toUpperCase() + key.slice(1);
          getResStub.withArgs(action, entity).returns(val);
          triggerChange();
          expect(ac.getSectionVisibility()[key]).toBe(val);
        }

        [
          ['read', 'entry'],
          ['read', 'asset'],
          ['read', 'apiKey'],
          ['update', 'settings']
        ].forEach(([action, section]) => {
          test(action, section, true);
          test(action, section, false);
        });
      });

      it('shows entries/assets section when it has "hide" flag, but policy checker grants access', function () {
        function test (key, val) { expect(ac.getSectionVisibility()[key]).toBe(val); }
        test('entry', false);
        test('asset', false);
        policyChecker.canAccessEntries = sinon.stub().returns(true);
        policyChecker.canAccessAssets = sinon.stub().returns(true);
        triggerChange();
        test('entry', true);
        test('asset', true);
        sinon.assert.calledOnce(policyChecker.canAccessEntries);
        sinon.assert.calledOnce(policyChecker.canAccessAssets);
      });
    });

    describe('#shouldHide and #shouldDisable', function () {
      it('are shortcuts to response object properties', function () {
        getResStub.withArgs('read', 'Entry').returns(false);
        triggerChange();
        const response = ac.getResponseByActionName('readEntry');
        expect(response.shouldHide).toBe(true);
        expect(response.shouldDisable).toBe(false);
        expect(ac.shouldHide('readEntry')).toBe(response.shouldHide);
        expect(ac.shouldDisable('readEntry')).toBe(response.shouldDisable);
      });

      it('returns false for unknown actions', function () {
        expect(ac.shouldHide('unknown')).toBe(false);
        expect(ac.shouldDisable('unknown')).toBe(false);
      });
    });

    describe('#canPerformActionOnEntity', function () {
      it('calls "can" with entity data and extracts result from response', function () {
        const entity = {data: {}};
        getResStub.withArgs('update', entity.data).returns('YES WE CAN');
        const result = ac.canPerformActionOnEntity('update', entity);
        sinon.assert.calledOnce(getResStub.withArgs('update', entity.data));
        expect(result).toBe('YES WE CAN');
      });

      it('determines enforcements for entity type', function () {
        const reasons = ['DENIED!'];
        const entity = {data: {sys: {type: 'Entry'}}};
        reasonsDeniedStub.withArgs('update', entity.data).returns(reasons);
        getResStub.withArgs('update', entity.data).returns(false);
        ac.canPerformActionOnEntity('update', entity);
        sinon.assert.calledOnce(enforcements.determineEnforcement.withArgs(
          mockSpace.organization,
          reasons,
          entity.data.sys.type
        ));
      });
    });

    describe('#canPerformActionOnEntryOfType', function () {
      it('calls "can" with fake entity of given content type and extracts result from response', function () {
        getResStub.returns(true);
        const result = ac.canPerformActionOnEntryOfType('update', 'ctid');
        const args = getResStub.lastCall.args;
        expect(args[0]).toBe('update');
        expect(args[1].sys.contentType.sys.id).toBe('ctid');
        expect(args[1].sys.type).toBe('Entry');
        expect(result).toBe(true);
      });
    });

    describe('#canUpdateEntry', function () {
      const entry = {data: {sys: {contentType: {sys: {id: 'ctid'}}}}};

      it('returns true if "can" returns true', function () {
        getResStub.withArgs('update', entry.data).returns(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', function () {
        getResStub.withArgs('update', entry.data).returns(false);
        policyChecker.canUpdateEntriesOfType = sinon.stub().returns(false);
        expect(ac.canUpdateEntry(entry)).toBe(false);
        sinon.assert.calledOnce(policyChecker.canUpdateEntriesOfType.withArgs('ctid'));
      });

      it('returns true if "can" returns false but there are allow policies', function () {
        getResStub.withArgs('update', entry.data).returns(false);
        policyChecker.canUpdateEntriesOfType = sinon.stub().returns(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
        sinon.assert.calledOnce(policyChecker.canUpdateEntriesOfType.withArgs('ctid'));
      });
    });

    describe('#canUpdateAsset', function () {
      const asset = {data: {}};

      it('returns true if "can" returns true', function () {
        getResStub.withArgs('update', asset.data).returns(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', function () {
        getResStub.withArgs('update', asset.data).returns(false);
        policyChecker.canUpdateAssets = sinon.stub().returns(false);
        expect(ac.canUpdateAsset(asset)).toBe(false);
        sinon.assert.calledOnce(policyChecker.canUpdateAssets);
      });

      it('returns true if "can" returns false but there are allow policies', function () {
        getResStub.withArgs('update', asset.data).returns(false);
        policyChecker.canUpdateAssets = sinon.stub().returns(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
        sinon.assert.calledOnce(policyChecker.canUpdateAssets);
      });
    });

    describe('#canUploadMultipleAssets', function () {
      function setup (canCreate, canUpdate, canUpdateWithPolicy, canUpdateOwn) {
        getResStub.withArgs('create', 'Asset').returns(canCreate);
        getResStub.withArgs('update', 'Asset').returns(canUpdate);
        policyChecker.canUpdateAssets = sinon.stub().returns(canUpdateWithPolicy);
        policyChecker.canUpdateOwnAssets = sinon.stub().returns(canUpdateOwn);
      }

      it('returns false if assets cannot be created', function () {
        setup(false, false, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns false if assets cannot be updated', function () {
        setup(true, false, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns false if assets and own assets cannot be updated', function () {
        setup(true, false, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns true if assets can be created and updated', function () {
        setup(true, true, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and updated with policy', function () {
        setup(true, false, true, false);
        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and own assets can be updated', function () {
        setup(true, false, false, true);
        expect(ac.canUploadMultipleAssets()).toBe(true);
      });
    });

    describe('#canModifyApiKeys', function () {
      it('returns related response', function () {
        expect(ac.canModifyApiKeys()).toBe(false);
        getResStub.withArgs('create', 'ApiKey').returns(true);
        triggerChange();
        expect(ac.canModifyApiKeys()).toBe(true);
      });
    });

    describe('#canModifyRoles', function () {
      function changeSpace (hasFeature, isSpaceAdmin) {
        ac.setSpace({
          organization: {
            sys: {id: 'orgid'},
            subscriptionPlan: {limits: {features: {customRoles: hasFeature}}}
          },
          spaceMembership: {admin: isSpaceAdmin}
        });
      }

      it('returns true when has feature and is admin of space, false otherwise', function* () {
        OrganizationRoles.setUser({organizationMemberships: []});
        changeSpace(false, true);
        expect(yield ac.canModifyRoles()).toBe(false);
        changeSpace(true, false);
        expect(yield ac.canModifyRoles()).toBe(false);
        changeSpace(true, true);
        expect(yield ac.canModifyRoles()).toBe(true);
      });

      it('returns true when has feature, is not admin of space but is admin or owner of organization', function () {
        const user = {organizationMemberships: [
          {organization: {sys: {id: 'org1id'}}, role: 'admin'},
          {organization: {sys: {id: 'org2id'}}, role: 'member'},
          {organization: {sys: {id: 'org3id'}}, role: 'owner'}
        ]};

        OrganizationRoles.setUser(user);
        changeSpace(true, false);

        expect(ac.canModifyUsers()).toBe(false);
        t('org1id', true);
        t('org2id', false);
        t('org3id', true);
        t('unknown', false);

        function t (id, expectation) {
          ac.setSpace({organization: {sys: {id}}});
          expect(ac.canModifyUsers()).toBe(expectation);
        }
      });
    });

    describe('#canCreateSpaceInOrganization', function () {
      it('returns false if there is no authContext', function () {
        changeAuthContext(null);
        expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
      });

      it('returns result of organization authContext "can" call', function () {
        const organizationCanStub = sinon.stub().returns('YES WE CAN');
        changeAuthContext(makeAuthContext({
          orgid: organizationCanStub
        }));

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe('YES WE CAN');
        sinon.assert.calledOnce(organizationCanStub.withArgs('create', 'Space'));
      });

      it('returns false and logs if organization authContext throws', function () {
        changeAuthContext(makeAuthContext({
          orgid: sinon.stub().throws()
        }));

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
        const logger = this.$inject('logger');
        sinon.assert.calledOnce(logger.logError);
        expect(logger.logError.args[0][0].indexOf('Worf exception')).toBe(0);
      });
    });

    describe('#canCreateSpaceInAnyOrganization', function () {
      beforeEach(function () {
        TokenStore.organizations$ = K.createMockProperty([
          {sys: {id: 'org1'}}, {sys: {id: 'org2'}}
        ]);
      });

      it('returns true if space can be created in at least on organization', function () {
        changeAuthContext(makeAuthContext({
          org1: sinon.stub().returns(false),
          org2: sinon.stub().returns(true)
        }));

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(true);
      });

      it('returns false if space cannot be create in any organization', function () {
        changeAuthContext(makeAuthContext({
          org1: sinon.stub().returns(false),
          org2: sinon.stub().returns(false)
        }));

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(false);
      });
    });

    describe('#canCreateSpace', function () {
      let organizationCanStub, canStub;

      beforeEach(function () {
        organizationCanStub = sinon.stub().returns(false);
        canStub = sinon.stub().returns(false);
        TokenStore.organizations$ = K.createMockProperty([{sys: {id: 'org1'}}]);
        changeAuthContext(makeAuthContext({
          org1: organizationCanStub
        }, canStub));
      });

      it('returns false when authContext is not defined', function () {
        changeAuthContext(null);
        expect(ac.canCreateSpace()).toBe(false);
      });

      it('returns false when there are no organizations', function () {
        TokenStore.organizations$.set([]);
        expect(ac.canCreateSpace()).toBe(false);
      });

      it('returns false when cannot create space in some organization', function () {
        organizationCanStub.returns(false);
        expect(ac.canCreateSpace()).toBe(false);
        sinon.assert.calledOnce(organizationCanStub);
      });

      it('returns true if can create space in some organization and can create space in general', function () {
        organizationCanStub.returns(true);
        canStub.returns(true);
        expect(ac.canCreateSpace()).toBe(true);
        sinon.assert.calledOnce(organizationCanStub);
      });

      it('returns false if can create space in some organization but cannot create spaces in general', function () {
        organizationCanStub.returns(true);
        canStub.returns(false);
        expect(ac.canCreateSpace()).toBe(false);
        sinon.assert.calledOnce(organizationCanStub);
        sinon.assert.calledOnce(canStub);
      });

      it('broadcasts enforcement if found for a general case', function () {
        const reasons = ['REASONS!'];
        const enforcement = {message: 'MESSAGE'};
        organizationCanStub.returns(true);
        canStub.returns(false);
        reasonsDeniedStub.withArgs('create', 'Space').returns(reasons);
        enforcements.determineEnforcement.withArgs(
          mockSpace.organization,
          reasons,
          'Space'
        ).returns(enforcement);
        expect(ac.canCreateSpace()).toBe(false);
        sinon.assert.calledOnce(broadcastStub.withArgs(enforcement));
      });
    });

    describe('#canCreateOrganization', function () {
      beforeEach(function () {
        TokenStore.user$ = K.createMockProperty();
      });

      it('maps to TokenStore.user$.canCreateOrganization', function () {
        TokenStore.user$.set({ canCreateOrganization: true });
        expect(ac.canCreateOrganization()).toEqual(true);
        TokenStore.user$.set({ canCreateOrganization: false });
        expect(ac.canCreateOrganization()).toEqual(false);
      });
      it('defaults to false', function () {
        TokenStore.user$.set(null);
        expect(ac.canCreateOrganization()).toEqual(false);
      });
    });

    describe('#wasForbidden', function () {
      it('returns callback function', function () {
        expect(_.isFunction(ac.wasForbidden)).toBe(true);
      });

      it('sets "forbidden" flag on provided context if response is 404/3', function () {
        [200, 404, 403].forEach(function (status) {
          const context = {};
          const cb1 = ac.wasForbidden(context);
          cb1({statusCode: status});
          expect(context.forbidden).toBe(status === 200 ? undefined : true);
        });
      });

      pit('returns resolved promise with context if was forbidden', function () {
        const ctx = {};
        const cb1 = ac.wasForbidden(ctx);

        return cb1({statusCode: 404}).then(function (ctx2) {
          expect(ctx === ctx2).toBe(true);
          expect(ctx2.forbidden).toBe(true);
        });
      });

      pit('returns rejected promise with response if was not forbidden', function () {
        const cb = ac.wasForbidden({});
        const res = {statusCode: 400};

        return cb(res).then(_.noop, function (res2) {
          expect(res === res2);
        });
      });
    });
  });
});

/**
 * Create a mock for a @contentful/worf authContext object.
 *
 * The argument is a map from organization IDs to 'can' functions.
 */
function makeAuthContext (orgs, can = sinon.stub()) {
  return {
    organization (id) {
      return {can: orgs[id]};
    },
    hasOrganization (id) {
      return id in orgs;
    },
    can
  };
}
