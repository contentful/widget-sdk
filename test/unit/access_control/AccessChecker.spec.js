import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';

describe('Access Checker', () => {
  let enforcements, OrganizationRoles, TokenStore, policyChecker, ac, changeSpace;
  let getResStub,
    reasonsDeniedStub,
    broadcastStub,
    resetEnforcements,
    mockSpace,
    mockSpaceAuthContext,
    mockOrgEndpoint,
    mockSpaceEndpoint,
    isPermissionDeniedStub,
    feature;

  function init() {
    ac.setAuthContext({ authContext: {}, spaceAuthContext: mockSpaceAuthContext });
    ac.setSpace(mockSpace);
  }

  function triggerChange() {
    ac.setSpace(mockSpace);
  }

  function changeAuthContext(authContext) {
    ac.setAuthContext({ authContext, spaceAuthContext: mockSpaceAuthContext });
  }

  afterEach(() => {
    enforcements = OrganizationRoles = policyChecker = ac = getResStub = reasonsDeniedStub = isPermissionDeniedStub = broadcastStub = mockSpaceEndpoint = feature = null;
  });

  beforeEach(function() {
    this.stubs = {
      logError: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.value('data/EndpointFactory.es6', {
        createOrganizationEndpoint: () => mockOrgEndpoint,
        createSpaceEndpoint: () => mockSpaceEndpoint
      });
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: sinon.stub().resolves(false)
      });
      $provide.value('services/FeatureService.es6', {
        default: () => {
          return {
            get: () => {
              return Promise.resolve(_.get(feature, 'enabled', false));
            }
          };
        }
      });
      $provide.constant('services/logger.es6', {
        logError: this.stubs.logError
      });
    });

    enforcements = this.$inject('access_control/Enforcements.es6');
    OrganizationRoles = this.$inject('services/OrganizationRoles.es6');
    TokenStore = this.$inject('services/TokenStore.es6');
    policyChecker = this.$inject('access_control/AccessChecker/PolicyChecker.es6');

    const acUtils = this.$inject('access_control/AccessChecker/Utils.es6');
    acUtils.broadcastEnforcement = broadcastStub = sinon.stub();
    acUtils.resetEnforcements = resetEnforcements = sinon.stub();

    const responseCache = this.$inject('access_control/AccessChecker/ResponseCache.es6');
    responseCache.getResponse = getResStub = sinon.stub().returns(false);

    reasonsDeniedStub = sinon.stub().returns([]);
    isPermissionDeniedStub = sinon.stub().returns(false);
    enforcements.determineEnforcement = sinon.stub().returns(undefined);

    mockSpace = { sys: { id: '1234' }, organization: { sys: {} } };
    mockSpaceAuthContext = {
      reasonsDenied: reasonsDeniedStub,
      isPermissionDenied: isPermissionDeniedStub
    };
    mockOrgEndpoint = sinon.stub();
    mockSpaceEndpoint = sinon.stub();

    feature = {
      enabled: true,
      sys: {
        type: 'SpaceFeature',
        id: 'customRoles'
      }
    };

    ac = this.$inject('access_control/AccessChecker');

    changeSpace = function changeSpace({ hasFeature, isSpaceAdmin, userRoleName }) {
      ac.setSpace({
        sys: {
          id: '1234'
        },
        organization: {
          sys: { id: 'orgid' },
          subscriptionPlan: { limits: { features: { customRoles: hasFeature } } }
        },
        spaceMembership: { admin: isSpaceAdmin, roles: [{ name: userRoleName }] }
      });

      feature.enabled = hasFeature;
    };
  });

  describe('Initialization', () => {
    it('sets isInitialized$ to false when authContext is null', () => {
      ac.setOrganization(null);
      ac.setAuthContext({ authContext: null });
      expect(K.getValue(ac.isInitialized$)).toEqual(false);

      ac.setOrganization({ sys: {} });
      expect(K.getValue(ac.isInitialized$)).toEqual(false);

      ac.setSpace(mockSpace);
      expect(K.getValue(ac.isInitialized$)).toEqual(false);
    });
    it('sets isInitialized$ to true when authContext is set', () => {
      ac.setAuthContext({ authContext: {} });
      expect(K.getValue(ac.isInitialized$)).toEqual(true);
    });
    it('sets isInitialized$ to true when authContext, spaceAuthContext and space are set', () => {
      ac.setSpace(mockSpace);
      ac.setAuthContext({ authContext: {}, spaceAuthContext: mockSpaceAuthContext });
      expect(K.getValue(ac.isInitialized$)).toEqual(true);
    });
  });

  describe('Access checker methods', () => {
    beforeEach(() => {
      init();
    });

    describe('#getResponses', () => {
      it('collects responses when auth context changes', () => {
        const responses = ac.getResponses();
        triggerChange();
        expect(ac.getResponses() === responses).toBe(false);
      });

      it('contains keys for actions', () => {
        const responses = ac.getResponses();
        const keys = ['create', 'read', 'update'];
        const intersection = _.intersection(_.keys(responses), keys);
        expect(intersection.length).toBe(keys.length);
      });

      it('should not hide or disable when operation can be performed', () => {
        getResStub.withArgs('read', 'Entry').returns(true);
        triggerChange();
        const response = ac.getResponses().read.entry;
        expect(response.can).toBe(true);
        expect(response.shouldHide).toBe(false);
        expect(response.shouldDisable).toBe(false);
      });

      it('should disable, but not hide when operation cannot be performed and reasons for denial are given', () => {
        reasonsDeniedStub.withArgs('read', 'Entry').returns(['DENIED!']);
        triggerChange();
        const response = ac.getResponses().read.entry;
        expect(response.can).toBe(false);
        expect(response.shouldHide).toBe(false);
        expect(response.shouldDisable).toBe(true);
        expect(_.first(response.reasons)).toBe('DENIED!');
      });

      it('should hide when operation cannot be performed and no reasons are given', () => {
        const response = ac.getResponses().read.entry;
        expect(response.can).toBe(false);
        expect(response.shouldHide).toBe(true);
        expect(response.shouldDisable).toBe(false);
        expect(response.reasons).toBe(null);
      });

      it('should reset the persistent notification', () => {
        sinon.assert.called(resetEnforcements);
      });

      it('should broadcast enforcement if found', () => {
        const reasons = ['DENIED!'];
        const enforcement = { message: 'ENFORCEMENT MSG' };
        reasonsDeniedStub.withArgs('read', 'Entry').returns(reasons);
        enforcements.determineEnforcement
          .withArgs(mockSpace, reasons, 'Entry')
          .returns(enforcement);
        triggerChange();
        sinon.assert.calledOnce(broadcastStub.withArgs(enforcement));
      });
    });

    describe('#getResponseByActionAndEntity', () => {
      it('returns undefined for an unknown action', () => {
        expect(ac.getResponseByActionAndEntity('unknown')).toBe(undefined);
      });

      it('returns undefined for an unknown action and entity', () => {
        expect(ac.getResponseByActionAndEntity('create', 'unknown')).toBe(undefined);
      });

      it('returns response for a known action', () => {
        const action = 'read';
        const entityType = 'entry';
        const response = ac.getResponseByActionAndEntity(action, entityType);
        expect(response).toBe(ac.getResponses()[action][entityType]);
        expect(_.isObject(response) && response.can === false).toBe(true);
      });
    });

    describe('#getSectionVisibility', () => {
      it('changes when auth context changes', () => {
        const visibility = ac.getSectionVisibility();
        triggerChange();
        expect(ac.getSectionVisibility() === visibility).toBe(false);
      });

      it('checks if there is a "hide" flag for chosen actions', () => {
        function test(action, key, val) {
          const entity = key.charAt(0).toUpperCase() + key.slice(1);
          getResStub.withArgs(action, entity).returns(val);
          triggerChange();
          expect(ac.getSectionVisibility()[key]).toBe(val);
        }

        [['read', 'entry'], ['read', 'asset'], ['read', 'apiKey'], ['update', 'settings']].forEach(
          ([action, entityType]) => {
            test(action, entityType, true);
            test(action, entityType, false);
          }
        );
      });

      it('should return false for apiKey if settings is not readable (permission denied)', () => {
        getResStub.returns(true);
        isPermissionDeniedStub.returns(true);
        triggerChange();

        expect(ac.getSectionVisibility().apiKey).toBe(false);
      });

      it('should return true for apiKey if settings is readable (permission not denied)', () => {
        getResStub.returns(true);
        isPermissionDeniedStub.returns(false);
        triggerChange();

        expect(ac.getSectionVisibility().apiKey).toBe(true);
      });

      it('should return false for environments if settings is not readable (permission denied)', () => {
        getResStub.returns(true);
        isPermissionDeniedStub.returns(true);
        triggerChange();

        expect(ac.getSectionVisibility().environments).toBe(false);
      });

      it('should return true for environments if settings is readable (permission not denied)', () => {
        getResStub.returns(true);
        isPermissionDeniedStub.returns(false);
        triggerChange();

        expect(ac.getSectionVisibility().environments).toBe(true);
      });

      it('shows entries/assets section when it has "hide" flag, but policy checker grants access', () => {
        function test(key, val) {
          expect(ac.getSectionVisibility()[key]).toBe(val);
        }
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
      it('should return "true" for spaceHome if user is admin', () => {
        changeSpace({ hasFeature: true, isSpaceAdmin: true });
        expect(ac.getSectionVisibility().spaceHome).toBe(true);
      });
      it('should return "true" for spaceHome if user is author', () => {
        changeSpace({ hasFeature: true, isSpaceAdmin: false, userRoleName: 'Author' });
        expect(ac.getSectionVisibility().spaceHome).toBe(true);
      });
      it('should return "true" for spaceHome if user is editor', () => {
        changeSpace({ hasFeature: true, isSpaceAdmin: false, userRoleName: 'Editor' });
        expect(ac.getSectionVisibility().spaceHome).toBe(true);
      });
      it('should return "false" for spaceHome if user is not an admin, editor or author', () => {
        changeSpace({ hasFeature: true, isSpaceAdmin: false });
        expect(ac.getSectionVisibility().spaceHome).toBe(false);
      });
    });

    describe('#shouldHide and #shouldDisable', () => {
      it('are shortcuts to response object properties', () => {
        getResStub.withArgs('read', 'Entry').returns(false);
        triggerChange();
        const response = ac.getResponseByActionAndEntity('read', 'entry');
        expect(response.shouldHide).toBe(true);
        expect(response.shouldDisable).toBe(false);
        expect(ac.shouldHide('read', 'entry')).toBe(response.shouldHide);
        expect(ac.shouldDisable('read', 'entry')).toBe(response.shouldDisable);
      });

      it('returns false for unknown actions', () => {
        expect(ac.shouldHide('unknown')).toBe(false);
        expect(ac.shouldDisable('unknown')).toBe(false);
      });
    });

    describe('#shouldHide', () => {
      it('should return false if the read permission is denied, even if response.shouldHide is false', () => {
        getResStub.returns(true);
        isPermissionDeniedStub.returns(true);
        triggerChange();

        const response = ac.getResponseByActionAndEntity('read', 'entry');
        expect(response.shouldHide).toBe(false);
        expect(ac.shouldHide('read', 'entry')).toBe(true);
      });
    });

    describe('#canPerformActionOnEntity', () => {
      it('calls "can" with entity data and extracts result from response', () => {
        const entity = { data: {} };
        getResStub.withArgs('update', entity.data).returns('YES WE CAN');
        const result = ac.canPerformActionOnEntity('update', entity);
        sinon.assert.calledOnce(getResStub.withArgs('update', entity.data));
        expect(result).toBe('YES WE CAN');
      });

      it('determines enforcements for entity type', () => {
        const reasons = ['DENIED!'];
        const entity = { data: { sys: { type: 'Entry' } } };
        reasonsDeniedStub.withArgs('update', entity.data).returns(reasons);
        getResStub.withArgs('update', entity.data).returns(false);
        ac.canPerformActionOnEntity('update', entity);
        sinon.assert.calledOnce(
          enforcements.determineEnforcement.withArgs(mockSpace, reasons, entity.data.sys.type)
        );
      });
    });

    describe('#canPerformActionOnEntryOfType', () => {
      it('calls "can" with fake entity of given content type and extracts result from response', () => {
        getResStub.returns(true);
        const result = ac.canPerformActionOnEntryOfType('update', 'ctid');
        const args = getResStub.lastCall.args;
        expect(args[0]).toBe('update');
        expect(args[1].sys.contentType.sys.id).toBe('ctid');
        expect(args[1].sys.type).toBe('Entry');
        expect(result).toBe(true);
      });
    });

    describe('#canUpdateEntry', () => {
      const entry = { data: { sys: { contentType: { sys: { id: 'ctid' } } } } };

      it('returns true if "can" returns true', () => {
        getResStub.withArgs('update', entry.data).returns(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', () => {
        getResStub.withArgs('update', entry.data).returns(false);
        policyChecker.canUpdateEntriesOfType = sinon.stub().returns(false);
        expect(ac.canUpdateEntry(entry)).toBe(false);
        sinon.assert.calledOnce(policyChecker.canUpdateEntriesOfType.withArgs('ctid'));
      });

      it('returns true if "can" returns false but there are allow policies', () => {
        getResStub.withArgs('update', entry.data).returns(false);
        policyChecker.canUpdateEntriesOfType = sinon.stub().returns(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
        sinon.assert.calledOnce(policyChecker.canUpdateEntriesOfType.withArgs('ctid'));
      });

      it('returns false if permission is explicitly denied', () => {
        isPermissionDeniedStub.returns(true);
        getResStub.withArgs('update', entry.data).returns(true);
        policyChecker.canUpdateEntriesOfType = sinon.stub().returns(true);

        expect(ac.canUpdateEntry(entry)).toBe(false);
      });
    });

    describe('#canUpdateAsset', () => {
      const asset = { data: {} };

      it('returns true if "can" returns true', () => {
        getResStub.withArgs('update', asset.data).returns(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', () => {
        getResStub.withArgs('update', asset.data).returns(false);
        policyChecker.canUpdateAssets = sinon.stub().returns(false);
        expect(ac.canUpdateAsset(asset)).toBe(false);
        sinon.assert.calledOnce(policyChecker.canUpdateAssets);
      });

      it('returns true if "can" returns false but there are allow policies', () => {
        getResStub.withArgs('update', asset.data).returns(false);
        policyChecker.canUpdateAssets = sinon.stub().returns(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
        sinon.assert.calledOnce(policyChecker.canUpdateAssets);
      });

      it('returns false if permission is explicitly denied', () => {
        isPermissionDeniedStub.returns(true);
        getResStub.withArgs('update', asset.data).returns(true);
        policyChecker.canUpdateEntriesOfType = sinon.stub().returns(true);

        expect(ac.canUpdateEntry(asset)).toBe(false);
      });
    });

    describe('#canUploadMultipleAssets', () => {
      function setup(canCreate, canUpdate, canUpdateWithPolicy, canUpdateOwn) {
        getResStub.withArgs('create', 'Asset').returns(canCreate);
        getResStub.withArgs('update', 'Asset').returns(canUpdate);
        policyChecker.canUpdateAssets = sinon.stub().returns(canUpdateWithPolicy);
        policyChecker.canUpdateOwnAssets = sinon.stub().returns(canUpdateOwn);
      }

      it('returns false if assets cannot be created', () => {
        setup(false, false, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns false if assets cannot be updated', () => {
        setup(true, false, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns false if assets and own assets cannot be updated', () => {
        setup(true, false, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns true if assets can be created and updated', () => {
        setup(true, true, false, false);
        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and updated with policy', () => {
        setup(true, false, true, false);
        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and own assets can be updated', () => {
        setup(true, false, false, true);
        expect(ac.canUploadMultipleAssets()).toBe(true);
      });
    });

    describe('#canModifyApiKeys', () => {
      it('returns related response', () => {
        expect(ac.canModifyApiKeys()).toBe(false);
        getResStub.withArgs('create', 'ApiKey').returns(true);
        triggerChange();
        expect(ac.canModifyApiKeys()).toBe(true);
      });
    });

    describe('#canModifyRoles', () => {
      it('returns true when has feature and is admin of space, false otherwise', async () => {
        OrganizationRoles.setUser({ organizationMemberships: [] });
        changeSpace({ hasFeature: false, isSpaceAdmin: true });
        expect(await ac.canModifyRoles()).toBe(false);
        changeSpace({ hasFeature: true, isSpaceAdmin: false });
        expect(await ac.canModifyRoles()).toBe(false);
        changeSpace({ hasFeature: true, isSpaceAdmin: true });
        expect(await ac.canModifyRoles()).toBe(true);
      });

      it('should handle a null or undefined feature', function*() {
        OrganizationRoles.setUser({ organizationMemberships: [] });
        changeSpace({ hasFeature: false, isSpaceAdmin: true }); // User is space admin

        // Set the feature to null
        feature = null;
        expect(yield ac.canModifyRoles()).toBe(false);

        // Set the feature to undefined
        feature = undefined;
        expect(yield ac.canModifyRoles()).toBe(false);
      });

      it('returns true when has feature, is not admin of space but is admin or owner of organization', () => {
        const user = {
          organizationMemberships: [
            { organization: { sys: { id: 'org1id' } }, role: 'admin' },
            { organization: { sys: { id: 'org2id' } }, role: 'member' },
            { organization: { sys: { id: 'org3id' } }, role: 'owner' }
          ]
        };

        OrganizationRoles.setUser(user);
        changeSpace({ hasFeature: true, isSpaceAdmin: false });

        expect(ac.canModifyUsers()).toBe(false);
        t('org1id', true);
        t('org2id', false);
        t('org3id', true);
        t('unknown', false);

        function t(id, expectation) {
          ac.setSpace({ sys: { id: id }, organization: { sys: { id } } });
          expect(ac.canModifyUsers()).toBe(expectation);
        }
      });
    });

    describe('#canCreateSpaceInOrganization', () => {
      it('returns false if there is no authContext', () => {
        changeAuthContext(null);
        expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
      });

      it('returns result of organization authContext "can" call', () => {
        const organizationCanStub = sinon.stub().returns('YES WE CAN');
        changeAuthContext(
          makeAuthContext({
            orgid: organizationCanStub
          })
        );

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe('YES WE CAN');
        sinon.assert.calledOnce(organizationCanStub.withArgs('create', 'Space'));
      });

      it('returns false and logs if organization authContext throws', function() {
        changeAuthContext(
          makeAuthContext({
            orgid: sinon.stub().throws()
          })
        );

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
        sinon.assert.calledOnce(this.stubs.logError);
        expect(this.stubs.logError.args[0][0].indexOf('Worf exception')).toBe(0);
      });
    });

    describe('#canCreateSpaceInAnyOrganization', () => {
      beforeEach(() => {
        TokenStore.organizations$ = K.createMockProperty([
          { sys: { id: 'org1' } },
          { sys: { id: 'org2' } }
        ]);
      });

      it('returns true if space can be created in at least on organization', () => {
        changeAuthContext(
          makeAuthContext({
            org1: sinon.stub().returns(false),
            org2: sinon.stub().returns(true)
          })
        );

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(true);
      });

      it('returns false if space cannot be create in any organization', () => {
        changeAuthContext(
          makeAuthContext({
            org1: sinon.stub().returns(false),
            org2: sinon.stub().returns(false)
          })
        );

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(false);
      });
    });

    describe('#canCreateSpace', () => {
      let organizationCanStub, canStub;

      beforeEach(() => {
        organizationCanStub = sinon.stub().returns(false);
        canStub = sinon.stub().returns(false);
        TokenStore.organizations$ = K.createMockProperty([{ sys: { id: 'org1' } }]);
        changeAuthContext(
          makeAuthContext(
            {
              org1: organizationCanStub
            },
            canStub
          )
        );
      });

      it('returns false when authContext is not defined', () => {
        changeAuthContext(null);
        expect(ac.canCreateSpace()).toBe(false);
      });

      it('returns false when there are no organizations', () => {
        TokenStore.organizations$.set([]);
        expect(ac.canCreateSpace()).toBe(false);
      });

      it('returns false when cannot create space in some organization', () => {
        organizationCanStub.returns(false);
        expect(ac.canCreateSpace()).toBe(false);
        sinon.assert.calledOnce(organizationCanStub);
      });

      it('returns true if can create space in some organization and can create space in general', () => {
        organizationCanStub.returns(true);
        canStub.returns(true);
        expect(ac.canCreateSpace()).toBe(true);
        sinon.assert.calledOnce(organizationCanStub);
      });

      it('returns false if can create space in some organization but cannot create spaces in general', () => {
        organizationCanStub.returns(true);
        canStub.returns(false);
        expect(ac.canCreateSpace()).toBe(false);
        sinon.assert.calledOnce(organizationCanStub);
        sinon.assert.calledOnce(canStub);
      });

      it('broadcasts enforcement if found for a general case', () => {
        const reasons = ['REASONS!'];
        const enforcement = { message: 'MESSAGE' };
        organizationCanStub.returns(true);
        canStub.returns(false);
        reasonsDeniedStub.withArgs('create', 'Space').returns(reasons);
        enforcements.determineEnforcement
          .withArgs(mockSpace, reasons, 'Space')
          .returns(enforcement);
        expect(ac.canCreateSpace()).toBe(false);
        sinon.assert.calledOnce(broadcastStub.withArgs(enforcement));
      });
    });

    describe('#canCreateOrganization', () => {
      beforeEach(() => {
        TokenStore.user$ = K.createMockProperty();
      });

      it('maps to TokenStore.user$.canCreateOrganization', () => {
        TokenStore.user$.set({ canCreateOrganization: true });
        expect(ac.canCreateOrganization()).toEqual(true);
        TokenStore.user$.set({ canCreateOrganization: false });
        expect(ac.canCreateOrganization()).toEqual(false);
      });
      it('defaults to false', () => {
        TokenStore.user$.set(null);
        expect(ac.canCreateOrganization()).toEqual(false);
      });
    });

    describe('#wasForbidden', () => {
      it('returns callback function', () => {
        expect(_.isFunction(ac.wasForbidden)).toBe(true);
      });

      it('sets "forbidden" flag on provided context if response is 404/3', () => {
        [200, 404, 403].forEach(status => {
          const context = {};
          const cb1 = ac.wasForbidden(context);
          cb1({ statusCode: status });
          expect(context.forbidden).toBe(status === 200 ? undefined : true);
        });
      });

      it('returns resolved promise with context if was forbidden', () => {
        const ctx = {};
        const cb1 = ac.wasForbidden(ctx);

        return cb1({ statusCode: 404 }).then(ctx2 => {
          expect(ctx === ctx2).toBe(true);
          expect(ctx2.forbidden).toBe(true);
        });
      });

      it('returns rejected promise with response if was not forbidden', () => {
        const cb = ac.wasForbidden({});
        const res = { statusCode: 400 };

        return cb(res).then(_.noop, res2 => {
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
function makeAuthContext(orgs, can = sinon.stub()) {
  return {
    organization(id) {
      return { can: orgs[id] };
    },
    hasOrganization(id) {
      return id in orgs;
    },
    can
  };
}
