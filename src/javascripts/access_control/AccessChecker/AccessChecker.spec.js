import * as K from '../../../../test/utils/kefir';
import _ from 'lodash';
import * as ac from './index';

import * as EndpointFactory from 'data/EndpointFactory';
import * as ProductCatalog from 'data/CMA/ProductCatalog';
import * as LegacyFeatureService from 'services/LegacyFeatureService';
import * as Logger from 'services/logger';
import * as Service from 'components/shared/persistent-notification/service';
import * as Enforcements from 'access_control/Enforcements';
import * as ResponseCache from 'access_control/AccessChecker/ResponseCache';
import * as PolicyChecker from 'access_control/AccessChecker/PolicyChecker';
import * as TokenStore from 'services/TokenStore';
import * as Trials from 'features/trials';
import * as OrganizationRoles from 'services/OrganizationRoles';

jest.mock('data/EndpointFactory');
jest.mock('data/CMA/ProductCatalog');
jest.mock('services/LegacyFeatureService');
jest.mock('services/logger');
jest.mock('components/shared/persistent-notification/service');
jest.mock('access_control/Enforcements');
jest.mock('access_control/AccessChecker/ResponseCache');
jest.mock('access_control/AccessChecker/PolicyChecker');
jest.mock('services/TokenStore');
jest.mock('features/trials');

describe('Access Checker', () => {
  let stubs;
  let changeSpace;
  let getResStub,
    reasonsDeniedStub,
    hidePersistentNotification,
    mockSpace,
    mockSpaceAuthContext,
    mockOrgEndpoint,
    mockSpaceEndpoint,
    isPermissionDeniedStub,
    feature,
    getSpaceFeature,
    isTrialSpaceType;

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
    getResStub.mockImplementation((arg1, arg2) => {
      if (arg1 === 'create' && arg2 === 'Asset') {
        return false;
      }
    });
    triggerChange();

    const spaceAuthContext = {
      reasonsDenied: jest.fn().mockReturnValue([]),
      isPermissionDenied: jest.fn().mockReturnValue(permissionDenied),
      newEnforcement: {
        reasonsDenied: () => [
          'usageExceeded',
          `You do not have permissions to create on Asset, please contact your administrator for more information.`,
        ],
        enforcements: [],
      },
    };

    const organizationCanStub = jest.fn().mockReturnValue('YES WE CAN');

    ac.setAuthContext({
      authContext: makeAuthContext({
        orgid: organizationCanStub,
      }),
      spaceAuthContext,
    });
  }

  afterEach(() => {
    ac.reset();
    feature = null;
    jest.clearAllMocks();
  });

  beforeEach(async function () {
    stubs = {
      logError: jest.fn(),
      canAccessEntries: jest.fn().mockReturnValue(false),
      canAccessAssets: jest.fn().mockReturnValue(false),
      canUpdateEntriesOfType: jest.fn().mockReturnValue(false),
      canUpdateAssets: jest.fn(),
      canUpdateOwnAssets: jest.fn(),
      organizations$: K.createMockProperty(),
      user$: K.createMockProperty(),
    };

    hidePersistentNotification = jest.fn();
    getResStub = jest.fn().mockReturnValue(false);
    getSpaceFeature = jest.fn();
    isTrialSpaceType = jest.fn().mockReturnValue(false);

    EndpointFactory.createOrganizationEndpoint = jest.fn().mockReturnValue(mockOrgEndpoint);
    EndpointFactory.createSpaceEndpoint = jest.fn().mockReturnValue(mockSpaceEndpoint);
    ProductCatalog.getSpaceFeature = getSpaceFeature;
    LegacyFeatureService.default = jest.fn().mockReturnValue({
      get: async () => _.get(feature, 'enabled', false),
    });
    Logger.logError = stubs.logError;
    Service.hidePersistentNotification = hidePersistentNotification;
    Service.showPersistentNotification = jest.fn();
    Enforcements.determineEnforcement = jest.fn().mockReturnValue(undefined);
    ResponseCache.getResponse = getResStub;
    ResponseCache.reset = jest.fn();
    PolicyChecker.canAccessEntries = stubs.canAccessEntries;
    PolicyChecker.canAccessAssets = stubs.canAccessAssets;
    PolicyChecker.setMembership = jest.fn();
    PolicyChecker.canUpdateEntriesOfType = stubs.canUpdateEntriesOfType;
    PolicyChecker.canUpdateOwnEntries = jest.fn();
    PolicyChecker.canUpdateAssets = stubs.canUpdateAssets;
    PolicyChecker.canUpdateOwnAssets = stubs.canUpdateOwnAssets;
    TokenStore.organizations$ = stubs.organizations$;
    TokenStore.user$ = stubs.user$;
    Trials.isTrialSpaceType = isTrialSpaceType;

    reasonsDeniedStub = jest.fn().mockReturnValue([]);
    isPermissionDeniedStub = jest.fn().mockReturnValue(false);

    mockSpace = { sys: { id: '1234' }, organization: { sys: {} } };
    mockSpaceAuthContext = {
      reasonsDenied: reasonsDeniedStub,
      isPermissionDenied: isPermissionDeniedStub,
      newEnforcement: {},
    };
    mockOrgEndpoint = jest.fn();
    mockSpaceEndpoint = jest.fn();

    feature = {
      enabled: true,
      sys: {
        type: 'SpaceFeature',
        id: 'customRoles',
      },
    };

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
        expect(intersection).toHaveLength(keys.length);
      });

      it('should not hide or disable when operation can be performed', () => {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'read' && arg2 === 'Entry') {
            return true;
          }
        });
        triggerChange();
        const response = ac.getResponses().read.entry;
        expect(response.can).toBe(true);
        expect(response.shouldHide).toBe(false);
        expect(response.shouldDisable).toBe(false);
      });

      it('should disable, but not hide when operation cannot be performed and reasons for denial are given', () => {
        reasonsDeniedStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'read' && arg2 === 'Entry') {
            return ['DENIED!'];
          }
        });
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
        expect(response.reasons).toBeNull();
      });

      it('should reset the persistent notification', () => {
        expect(hidePersistentNotification).toHaveBeenCalled();
      });
    });

    describe('#getResponseByActionAndEntity', () => {
      it('returns undefined for an unknown action', () => {
        expect(ac.getResponseByActionAndEntity('unknown')).toBeUndefined();
      });

      it('returns undefined for an unknown action and entity', () => {
        expect(ac.getResponseByActionAndEntity('create', 'unknown')).toBeUndefined();
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
        function testHelper(action, key, val) {
          const entity = key.charAt(0).toUpperCase() + key.slice(1);
          getResStub.mockImplementation((arg1, arg2) => {
            if (arg1 === action && arg2 === entity) {
              return val;
            }
          });
          triggerChange();
          expect(ac.getSectionVisibility()[key]).toBe(val);
        }

        [
          ['read', 'entry'],
          ['read', 'asset'],
          ['read', 'apiKey'],
          ['update', 'settings'],
        ].forEach(([action, entityType]) => {
          testHelper(action, entityType, true);
          testHelper(action, entityType, false);
        });
      });

      it('should return false for apiKey if settings is not readable (permission denied)', () => {
        getResStub.mockReturnValue(true);
        isPermissionDeniedStub.mockReturnValue(true);
        triggerChange();

        expect(ac.getSectionVisibility().apiKey).toBe(false);
      });

      it('should return true for apiKey if settings is readable (permission not denied)', () => {
        getResStub.mockReturnValue(true);
        isPermissionDeniedStub.mockReturnValue(false);
        triggerChange();

        expect(ac.getSectionVisibility().apiKey).toBe(true);
      });

      it('should return false for environments if settings is not readable (permission denied)', () => {
        getResStub.mockReturnValue(true);
        isPermissionDeniedStub.mockReturnValue(true);
        triggerChange();

        expect(ac.getSectionVisibility().environments).toBe(false);
      });

      it('should return true for environments if settings is readable (permission not denied)', () => {
        getResStub.mockReturnValue(true);
        isPermissionDeniedStub.mockReturnValue(false);
        triggerChange();

        expect(ac.getSectionVisibility().environments).toBe(true);
      });

      it('shows entries/assets section when it has "hide" flag, but policy checker grants access', function () {
        function testVisibility(key, val) {
          expect(ac.getSectionVisibility()[key]).toBe(val);
        }

        testVisibility('entry', false);
        testVisibility('asset', false);
        stubs.canAccessEntries.mockReturnValue(true);
        stubs.canAccessAssets.mockReturnValue(true);

        triggerChange();
        testVisibility('entry', true);
        testVisibility('asset', true);
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
      it('should return "true" for spaceHome if the space is a Trial Space if user is not an admin, editor or author', () => {
        isTrialSpaceType.mockReturnValue(true);
        changeSpace({ hasFeature: true, isSpaceAdmin: false });
        expect(ac.getSectionVisibility().spaceHome).toBe(true);
      });
    });

    describe('#shouldHide and #shouldDisable', () => {
      it('are shortcuts to response object properties', () => {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'read' && arg2 === 'Entry') {
            return false;
          }
        });
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
        getResStub.mockReturnValue(true);
        isPermissionDeniedStub.mockReturnValue(true);
        triggerChange();

        const response = ac.getResponseByActionAndEntity('read', 'entry');
        expect(response.shouldHide).toBe(false);
        expect(ac.shouldHide('read', 'entry')).toBe(true);
      });
    });

    describe('#canPerformActionOnEntity', () => {
      it('calls "can" with entity data and extracts result from response', () => {
        const entity = { data: {} };
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && _.isEqual(arg2, entity.data)) {
            return 'YES WE CAN';
          }
        });
        const result = ac.canPerformActionOnEntity('update', entity);
        expect(getResStub).toHaveBeenLastCalledWith('update', entity.data, {});
        expect(result).toBe('YES WE CAN');
      });

      it('determines enforcements for entity type', () => {
        const reasons = ['DENIED!'];
        const entity = { data: { sys: { type: 'Entry' } } };
        reasonsDeniedStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === entity.data) {
            return reasons;
          }
        });
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === entity.data) {
            return false;
          }
        });
        ac.canPerformActionOnEntity('update', entity);
        expect(Enforcements.determineEnforcement).toHaveBeenLastCalledWith(
          mockSpace,
          reasons,
          entity.data.sys.type
        );
      });
    });

    describe('#canUserReadEntities', () => {
      it('returns false if entities are falsy or not array', () => {
        expect(ac.canUserReadEntities(false)).toEqual(false);
        expect(ac.canUserReadEntities([])).toEqual(false);
        expect(ac.canUserReadEntities({})).toEqual(false);
        expect(ac.canUserReadEntities(null)).toEqual(false);
        expect(ac.canUserReadEntities(undefined)).toEqual(false);
      });

      it('returns true if the user has access to read each entity', () => {
        const entities = [
          { data: { sys: { type: 'Entry' } } },
          { data: { sys: { type: 'Asset' } } },
          { data: { sys: { type: 'Entry' } } },
          { data: { sys: { type: 'Asset' } } },
        ];
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'read' && _.isEqual(arg2, entities[0].data)) {
            return true;
          }
          if (arg1 === 'read' && _.isEqual(arg2, entities[1].data)) {
            return true;
          }
        });
        expect(ac.canUserReadEntities(entities)).toEqual(true);
      });

      it('returns false if the user has no access to read at least one entity', () => {
        const entities = [
          { data: { sys: { type: 'Entry' } } },
          { data: { sys: { type: 'Asset' } } },
          { data: { sys: { type: 'Entry' } } },
          { data: { sys: { type: 'Asset' } } },
        ];
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'read' && arg2 === entities[0].data) {
            return true;
          }
        });
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'read' && arg2 === entities[1].data) {
            return false;
          }
        });
        expect(ac.canUserReadEntities(entities)).toEqual(false);
      });
    });

    describe('#canPerformActionOnEntryOfType', () => {
      it('calls "can" with fake entity of given content type and extracts result from response', () => {
        getResStub.mockReturnValue(true);
        const result = ac.canPerformActionOnEntryOfType('update', 'ctid');
        const args = getResStub.mock.calls[getResStub.mock.calls.length - 1];
        expect(args[0]).toBe('update');
        expect(args[1].sys.contentType.sys.id).toBe('ctid');
        expect(args[1].sys.type).toBe('Entry');
        expect(result).toBe(true);
      });
    });

    describe('#canUpdateEntry', () => {
      const entry = { data: { sys: { contentType: { sys: { id: 'ctid' } } } } };

      it('returns true if "can" returns true', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === entry.data) {
            return true;
          }
        });
        expect(ac.canUpdateEntry(entry)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === entry.data) {
            return false;
          }
        });
        stubs.canUpdateEntriesOfType.mockReturnValue(false);
        expect(ac.canUpdateEntry(entry)).toBe(false);
        expect(stubs.canUpdateEntriesOfType).toHaveBeenCalledTimes(1);
        expect(stubs.canUpdateEntriesOfType).toHaveBeenCalledWith('ctid');
      });

      it('returns true if "can" returns false but there are allow policies', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === entry.data) {
            return false;
          }
        });
        stubs.canUpdateEntriesOfType.mockReturnValue(true);
        expect(ac.canUpdateEntry(entry)).toBe(true);
        expect(stubs.canUpdateEntriesOfType).toHaveBeenCalledTimes(1);
        expect(stubs.canUpdateEntriesOfType).toHaveBeenCalledWith('ctid');
      });

      it('returns false if permission is explicitly denied', function () {
        isPermissionDeniedStub.mockReturnValue(true);
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === entry.data) {
            return true;
          }
        });
        stubs.canUpdateEntriesOfType.mockReturnValue(true);

        expect(ac.canUpdateEntry(entry)).toBe(false);
      });
    });

    describe('#canUpdateAsset', function () {
      const asset = { data: {} };

      it('returns true if "can" returns true', () => {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === asset.data) {
            return true;
          }
        });
        expect(ac.canUpdateAsset(asset)).toBe(true);
      });

      it('returns false if "can" returns false and there are no allow policies', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === asset.data) {
            return false;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(false);
        expect(ac.canUpdateAsset(asset)).toBe(false);
        expect(stubs.canUpdateAssets).toHaveBeenCalledTimes(1);
      });

      it('returns true if "can" returns false but there are allow policies', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === asset.data) {
            return false;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(true);
        expect(ac.canUpdateAsset(asset)).toBe(true);
        expect(stubs.canUpdateAssets).toHaveBeenCalledTimes(1);
      });

      it('returns false if permission is explicitly denied', function () {
        isPermissionDeniedStub.mockReturnValue(true);
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'update' && arg2 === asset.data) {
            return true;
          }
        });
        stubs.canUpdateEntriesOfType.mockReturnValue(true);
        expect(ac.canUpdateEntry(asset)).toBe(false);
      });
    });

    describe('#canUploadMultipleAssets', function () {
      it('returns false if assets cannot be created', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'create' && arg2 === 'Asset') {
            return false;
          }
          if (arg1 === 'update' && arg2 === 'Asset') {
            return false;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(false);
        stubs.canUpdateOwnAssets.mockReturnValue(false);

        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns false if assets cannot be updated', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'create' && arg2 === 'Asset') {
            return true;
          }
          if (arg1 === 'update' && arg2 === 'Asset') {
            return false;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(false);
        stubs.canUpdateOwnAssets.mockReturnValue(false);

        expect(ac.canUploadMultipleAssets()).toBe(false);
      });

      it('returns true if assets can be created and updated', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'create' && arg2 === 'Asset') {
            return true;
          }
          if (arg1 === 'update' && arg2 === 'Asset') {
            return true;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(false);
        stubs.canUpdateOwnAssets.mockReturnValue(false);

        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and updated with policy', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'create' && arg2 === 'Asset') {
            return true;
          }
          if (arg1 === 'update' && arg2 === 'Asset') {
            return false;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(true);
        stubs.canUpdateOwnAssets.mockReturnValue(false);

        expect(ac.canUploadMultipleAssets()).toBe(true);
      });

      it('returns true if assets can be created and own assets can be updated', function () {
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'create' && arg2 === 'Asset') {
            return true;
          }
          if (arg1 === 'update' && arg2 === 'Asset') {
            return false;
          }
        });
        stubs.canUpdateAssets.mockReturnValue(false);
        stubs.canUpdateOwnAssets.mockReturnValue(true);

        expect(ac.canUploadMultipleAssets()).toBe(true);
      });
    });

    describe('#canModifyApiKeys', () => {
      it('returns related response', () => {
        expect(ac.canModifyApiKeys()).toBe(false);
        getResStub.mockImplementation((arg1, arg2) => {
          if (arg1 === 'create' && arg2 === 'ApiKey') {
            return true;
          }
        });
        triggerChange();
        expect(ac.canModifyApiKeys()).toBe(true);
      });
    });

    describe('#canModifyRoles', () => {
      it('returns true when has feature and is admin of space, false otherwise', async () => {
        OrganizationRoles.setUser({ organizationMemberships: [] });
        changeSpace({ hasFeature: false, isSpaceAdmin: true });
        getSpaceFeature.mockReturnValue(false);
        expect(await ac.canModifyRoles()).toBe(false);
        changeSpace({ hasFeature: true, isSpaceAdmin: false });
        getSpaceFeature.mockReturnValue(true);
        expect(await ac.canModifyRoles()).toBe(false);
        changeSpace({ hasFeature: true, isSpaceAdmin: true });
        getSpaceFeature.mockReturnValue(true);
        expect(await ac.canModifyRoles()).toBe(true);
      });

      it('should handle a null or undefined feature', async function () {
        OrganizationRoles.setUser({ organizationMemberships: [] });
        changeSpace({ hasFeature: false, isSpaceAdmin: true }); // User is space admin

        getSpaceFeature.mockReturnValue(null);
        expect(await ac.canModifyRoles()).toBe(false);

        getSpaceFeature.mockReturnValue(undefined);
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
        const organizationCanStub = jest.fn().mockReturnValue('YES WE CAN');
        changeAuthContext(
          makeAuthContext({
            orgid: organizationCanStub,
          })
        );

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe('YES WE CAN');
        expect(organizationCanStub).toHaveBeenCalledTimes(1);
        expect(organizationCanStub).toHaveBeenCalledWith('create', 'Space');
      });

      it('returns false and logs if organization authContext throws', function () {
        changeAuthContext(
          makeAuthContext({
            orgid: jest.fn().mockImplementation(() => {
              throw new Error();
            }),
          })
        );

        expect(ac.canCreateSpaceInOrganization('orgid')).toBe(false);
        expect(stubs.logError).toHaveBeenCalledTimes(1);
        expect(stubs.logError.mock.calls[0][0].indexOf('Worf exception')).toBe(0);
      });
    });

    describe('#canCreateSpaceInAnyOrganization', () => {
      beforeEach(function () {
        stubs.organizations$.set([{ sys: { id: 'org1' } }, { sys: { id: 'org2' } }]);
      });

      it('returns true if space can be created in at least on organization', () => {
        changeAuthContext(
          makeAuthContext({
            org1: jest.fn().mockReturnValue(false),
            org2: jest.fn().mockReturnValue(true),
          })
        );

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(true);
      });

      it('returns false if space cannot be create in any organization', () => {
        changeAuthContext(
          makeAuthContext({
            org1: jest.fn().mockReturnValue(false),
            org2: jest.fn().mockReturnValue(false),
          })
        );

        expect(ac.canCreateSpaceInAnyOrganization()).toBe(false);
      });
    });

    describe('#canCreateSpace', () => {
      let organizationCanStub, canStub;

      beforeEach(function () {
        organizationCanStub = jest.fn().mockReturnValue(false);
        canStub = jest.fn().mockReturnValue(false);
        stubs.organizations$.set([{ sys: { id: 'org1' } }]);
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
        organizationCanStub.mockReturnValue(false);
        expect(ac.canCreateSpace()).toBe(false);
        expect(organizationCanStub).toHaveBeenCalledTimes(1);
      });

      it('returns true if can create space in some organization and can create space in general', () => {
        organizationCanStub.mockReturnValue(true);
        canStub.mockReturnValue(true);
        expect(ac.canCreateSpace()).toBe(true);
        expect(organizationCanStub).toHaveBeenCalledTimes(1);
      });

      it('returns false if can create space in some organization but cannot create spaces in general', () => {
        organizationCanStub.mockReturnValue(true);
        canStub.mockReturnValue(false);
        expect(ac.canCreateSpace()).toBe(false);
        expect(organizationCanStub).toHaveBeenCalledTimes(1);
        expect(canStub).toHaveBeenCalledTimes(1);
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
  });
});

/**
 * Create a mock for a @contentful/worf authContext object.
 *
 * The argument is a map from organization IDs to 'can' functions.
 */
function makeAuthContext(orgs, can = jest.fn()) {
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
