import * as K from 'test/utils/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import { it } from 'test/utils/dsl';
import { $initialize } from 'test/utils/ng';

describe('Access Checker', () => {
  let enforcements, OrganizationRoles, TokenStore, ac, changeSpace;
  let getResStub,
    reasonsDeniedStub,
    broadcastStub,
    resetEnforcements,
    mockSpace,
    mockSpaceAuthContext,
    mockOrgEndpoint,
    mockSpaceEndpoint,
    isPermissionDeniedStub,
    feature,
    getSpaceFeature;

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

  function setupForNewUsageEnforcement(permissionDenied) {
    getResStub.withArgs('create', 'Asset').returns(false);
    triggerChange();

    const spaceAuthContext = {
      reasonsDenied: sinon.stub().returns([]),
      isPermissionDenied: sinon.stub().returns(permissionDenied),
      newEnforcement: {
        reasonsDenied: () => [
          'usageExceeded',
          `You do not have permissions to create on Asset, please contact your administrator for more information.`,
        ],
        enforcements: [],
      },
    };

    const organizationCanStub = sinon.stub().returns('YES WE CAN');

    ac.setAuthContext({
      authContext: makeAuthContext({
        orgid: organizationCanStub,
      }),
      spaceAuthContext,
    });
  }

  afterEach(() => {
    enforcements = OrganizationRoles = ac = getResStub = reasonsDeniedStub = isPermissionDeniedStub = broadcastStub = mockSpaceEndpoint = feature = resetEnforcements = null;
  });

  beforeEach(async function () {
    this.stubs = {
      logError: sinon.stub(),
      canAccessEntries: sinon.stub().returns(false),
      canAccessAssets: sinon.stub().returns(false),
      canUpdateEntriesOfType: sinon.stub().returns(false),
      canUpdateAssets: sinon.stub(),
      canUpdateOwnAssets: sinon.stub(),
      organizations$: K.createMockProperty(),
      user$: K.createMockProperty(),
    };

    broadcastStub = sinon.stub();
    resetEnforcements = sinon.stub();
    getResStub = sinon.stub().returns(false);
    getSpaceFeature = sinon.stub();

    this.system.set('data/EndpointFactory', {
      createOrganizationEndpoint: () => mockOrgEndpoint,
      createSpaceEndpoint: () => mockSpaceEndpoint,
    });
    this.system.set('data/CMA/ProductCatalog', {
      getSpaceFeature: getSpaceFeature,
    });
    this.system.set('utils/LaunchDarkly', {
      getCurrentVariation: sinon.stub().resolves(false),
    });
    this.system.set('services/LegacyFeatureService', {
      default: () => {
        return {
          get: () => {
            return Promise.resolve(_.get(feature, 'enabled', false));
          },
        };
      },
    });
    this.system.set('services/logger', {
      logError: this.stubs.logError,
    });
    this.system.set('access_control/AccessChecker/utils/resetEnforcements', {
      default: resetEnforcements,
    });
    this.system.set('access_control/AccessChecker/utils/broadcastEnforcement', {
      default: broadcastStub,
    });
    this.system.set('access_control/Enforcements', {
      determineEnforcement: sinon.stub().returns(undefined),
    });
    this.system.set('access_control/AccessChecker/ResponseCache', {
      getResponse: getResStub,
      reset: () => {},
    });
    this.system.set('access_control/AccessChecker/PolicyChecker', {
      canAccessEntries: this.stubs.canAccessEntries,
      canAccessAssets: this.stubs.canAccessAssets,
      setMembership: sinon.stub(),
      canUpdateEntriesOfType: this.stubs.canUpdateEntriesOfType,
      canUpdateOwnEntries: sinon.stub(),
      canUpdateAssets: this.stubs.canUpdateAssets,
      canUpdateOwnAssets: this.stubs.canUpdateOwnAssets,
    });
    this.system.set('services/TokenStore', {
      organizations$: this.stubs.organizations$,
      user$: this.stubs.user$,
    });

    enforcements = await this.system.import('access_control/Enforcements');
    OrganizationRoles = await this.system.import('services/OrganizationRoles');
    TokenStore = await this.system.import('services/TokenStore');

    reasonsDeniedStub = sinon.stub().returns([]);
    isPermissionDeniedStub = sinon.stub().returns(false);

    mockSpace = { sys: { id: '1234' }, organization: { sys: {} } };
    mockSpaceAuthContext = {
      reasonsDenied: reasonsDeniedStub,
      isPermissionDenied: isPermissionDeniedStub,
      newEnforcement: {},
    };
    mockOrgEndpoint = sinon.stub();
    mockSpaceEndpoint = sinon.stub();

    feature = {
      enabled: true,
      sys: {
        type: 'SpaceFeature',
        id: 'customRoles',
      },
    };

    ac = await this.system.import('access_control/AccessChecker');

    await $initialize(this.system);

    changeSpace = function changeSpace({ hasFeature, isSpaceAdmin, userRoleName }) {
      ac.setSpace({
        sys: {
          id: '1234',
        },
        organization: {
          sys: { id: 'orgid' },
          subscriptionPlan: { limits: { features: { customRoles: hasFeature } } },
        },
        spaceMember: { admin: isSpaceAdmin, roles: [{ name: userRoleName }] },
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

        [
          ['read', 'entry'],
          ['read', 'asset'],
          ['read', 'apiKey'],
          ['update', 'settings'],
        ].forEach(([action, entityType]) => {
          test(action, entityType, true);
          test(action, entityType, false);
        });
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

      it('shows entries/assets section when it has "hide" flag, but policy checker grants access', function () {
        function test(key, val) {
          expect(ac.getSectionVisibility()[key]).toBe(val);
        }

        test('entry', false);
        test('asset', false);
        this.stubs.canAccessEntries.returns(true);
        this.stubs.canAccessAssets.returns(true);

        triggerChange();
        test('entry', true);
        test('asset', true);
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

      describe('when enforcements from new usage checker exists', () => {
        it('should disable, but not hide', () => {
          setupForNewUsageEnforcement(false);
          const response = ac.getResponseByActionAndEntity('create', 'asset');

          expect(response.shouldDisable).toBe(true);
          expect(response.shouldHide).toBe(false);
          expect(ac.shouldHide('create', 'asset')).toBe(response.shouldHide);
          expect(ac.shouldDisable('create', 'asset')).toBe(response.shouldDisable);
        });

        it('should disable and hide when permissions is denied ', () => {
          setupForNewUsageEnforcement(true);
          expect(ac.shouldHide('create', 'asset')).toBe(true);
          expect(ac.shouldDisable('create', 'asset')).toBe(true);
        });
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

      it('returns true if "can" returns true', function () {
        getResStub.withArgs('update', entry.data).returns(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', function () {
        getResStub.withArgs('update', entry.data).returns(false);
        this.stubs.canUpdateEntriesOfType.returns(false);
        expect(ac.canUpdateEntry(entry)).toBe(false);
        sinon.assert.calledOnce(this.stubs.canUpdateEntriesOfType.withArgs('ctid'));
      });

      it('returns true if "can" returns false but there are allow policies', function () {
        getResStub.withArgs('update', entry.data).returns(false);
        this.stubs.canUpdateEntriesOfType.returns(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
        sinon.assert.calledOnce(this.stubs.canUpdateEntriesOfType.withArgs('ctid'));
      });

      it('returns false if permission is explicitly denied', function () {
        isPermissionDeniedStub.returns(true);
        getResStub.withArgs('update', entry.data).returns(true);
        this.stubs.canUpdateEntriesOfType.returns(true);

        expect(ac.canUpdateEntry(entry)).toBe(false);
      });
    });

    describe('#canUpdateAsset', function () {
      const asset = { data: {} };

      it('returns true if "can" returns true', () => {
        getResStub.withArgs('update', asset.data).returns(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', function () {
        getResStub.withArgs('update', asset.data).returns(false);
        this.stubs.canUpdateAssets.returns(false);
        expect(ac.canUpdateAsset(asset)).toBe(false);
        sinon.assert.calledOnce(this.stubs.canUpdateAssets);
      });

      it('returns true if "can" returns false but there are allow policies', function () {
        getResStub.withArgs('update', asset.data).returns(false);
        this.stubs.canUpdateAssets.returns(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
        sinon.assert.calledOnce(this.stubs.canUpdateAssets);
      });

      it('returns false if permission is explicitly denied', function () {
        isPermissionDeniedStub.returns(true);
        getResStub.withArgs('update', asset.data).returns(true);
        this.stubs.canUpdateEntriesOfType.returns(true);

        expect(ac.canUpdateEntry(asset)).toBe(false);
      });
    });

    describe('#canUploadMultipleAssets', function () {
      it('returns false if assets cannot be created', function () {
        getResStub.withArgs('create', 'Asset').returns(false);
        getResStub.withArgs('update', 'Asset').returns(false);
        this.stubs.canUpdateAssets.returns(false);
        this.stubs.canUpdateOwnAssets.returns(false);

        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns false if assets cannot be updated', function () {
        getResStub.withArgs('create', 'Asset').returns(true);
        getResStub.withArgs('update', 'Asset').returns(false);
        this.stubs.canUpdateAssets.returns(false);
        this.stubs.canUpdateOwnAssets.returns(false);

        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns true if assets can be created and updated', function () {
        getResStub.withArgs('create', 'Asset').returns(true);
        getResStub.withArgs('update', 'Asset').returns(true);
        this.stubs.canUpdateAssets.returns(false);
        this.stubs.canUpdateOwnAssets.returns(false);

        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and updated with policy', function () {
        getResStub.withArgs('create', 'Asset').returns(true);
        getResStub.withArgs('update', 'Asset').returns(false);
        this.stubs.canUpdateAssets.returns(true);
        this.stubs.canUpdateOwnAssets.returns(false);

        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and own assets can be updated', function () {
        getResStub.withArgs('create', 'Asset').returns(true);
        getResStub.withArgs('update', 'Asset').returns(false);
        this.stubs.canUpdateAssets.returns(false);
        this.stubs.canUpdateOwnAssets.returns(true);

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
        getSpaceFeature.returns(false);
        expect(await ac.canModifyRoles()).toBe(false);
        changeSpace({ hasFeature: true, isSpaceAdmin: false });
        getSpaceFeature.returns(true);
        expect(await ac.canModifyRoles()).toBe(false);
        changeSpace({ hasFeature: true, isSpaceAdmin: true });
        getSpaceFeature.returns(true);
        expect(await ac.canModifyRoles()).toBe(true);
      });

      it('should handle a null or undefined feature', async function () {
        OrganizationRoles.setUser({ organizationMemberships: [] });
        changeSpace({ hasFeature: false, isSpaceAdmin: true }); // User is space admin

        getSpaceFeature.returns(null);
        expect(await ac.canModifyRoles()).toBe(false);

        getSpaceFeature.returns(undefined);
        expect(await ac.canModifyRoles()).toBe(false);
      });

      it('returns true when has feature, is not admin of space but is admin or owner of organization', () => {
        const user = {
          organizationMemberships: [
            { organization: { sys: { id: 'org1id' } }, role: 'admin' },
            { organization: { sys: { id: 'org2id' } }, role: 'member' },
            { organization: { sys: { id: 'org3id' } }, role: 'owner' },
          ],
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
            orgid: organizationCanStub,
          })
        );

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe('YES WE CAN');
        sinon.assert.calledOnce(organizationCanStub.withArgs('create', 'Space'));
      });

      it('returns false and logs if organization authContext throws', function () {
        changeAuthContext(
          makeAuthContext({
            orgid: sinon.stub().throws(),
          })
        );

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
        sinon.assert.calledOnce(this.stubs.logError);
        expect(this.stubs.logError.args[0][0].indexOf('Worf exception')).toBe(0);
      });
    });

    describe('#canCreateSpaceInAnyOrganization', () => {
      beforeEach(function () {
        this.stubs.organizations$.set([{ sys: { id: 'org1' } }, { sys: { id: 'org2' } }]);
      });

      it('returns true if space can be created in at least on organization', () => {
        changeAuthContext(
          makeAuthContext({
            org1: sinon.stub().returns(false),
            org2: sinon.stub().returns(true),
          })
        );

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(true);
      });

      it('returns false if space cannot be create in any organization', () => {
        changeAuthContext(
          makeAuthContext({
            org1: sinon.stub().returns(false),
            org2: sinon.stub().returns(false),
          })
        );

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(false);
      });
    });

    describe('#canCreateSpace', () => {
      let organizationCanStub, canStub;

      beforeEach(function () {
        organizationCanStub = sinon.stub().returns(false);
        canStub = sinon.stub().returns(false);
        this.stubs.organizations$.set([{ sys: { id: 'org1' } }]);
        changeAuthContext(
          makeAuthContext(
            {
              org1: organizationCanStub,
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
        [200, 404, 403].forEach((status) => {
          const context = {};
          const cb1 = ac.wasForbidden(context);
          cb1({ statusCode: status });
          expect(context.forbidden).toBe(status === 200 ? undefined : true);
        });
      });

      it('returns resolved promise with context if was forbidden', () => {
        const ctx = {};
        const cb1 = ac.wasForbidden(ctx);

        return cb1({ statusCode: 404 }).then((ctx2) => {
          expect(ctx === ctx2).toBe(true);
          expect(ctx2.forbidden).toBe(true);
        });
      });

      it('returns rejected promise with response if was not forbidden', () => {
        const cb = ac.wasForbidden({});
        const res = { statusCode: 400 };

        return cb(res).then(_.noop, (res2) => {
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
    can,
  };
}
