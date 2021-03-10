import * as logger from 'services/logger';
import { getBrowserStorage as _getBrowserStorage } from 'core/services/BrowserStorage';
import {
  getSpaceInfo as _getSpaceInfo,
  checkOrgAccess as _checkOrgAccess,
  getOrg as _getOrg,
  getOnboardingSpaceId as _getOnboardingSpaceId,
} from './utils';
import * as spaceContextMock from '__mocks__/ng/spaceContext';
import { canReadApiKeys as _canReadApiKeys } from 'access_control/AccessChecker';
import { resolveLink, LinkType } from './resolver';
import { getOrganizationSpaces as _getOrganizationSpaces } from 'services/TokenStore';

const mockApiKeyRepo = {
  getAll: jest.fn(),
};

jest.mock('access_control/AccessChecker', () => ({
  canReadApiKeys: jest.fn(),
}));
const canReadApiKeys = _canReadApiKeys as jest.Mock;

jest.mock('./utils', () => ({
  getSpaceInfo: jest.fn(),
  getOnboardingSpaceId: jest.fn(),
  getOrg: jest.fn(),
  checkOrgAccess: jest.fn(),
}));
const getSpaceInfo = _getSpaceInfo as jest.Mock;
const getOrg = _getOrg as jest.Mock;
const checkOrgAccess = _checkOrgAccess as jest.Mock;
const getOnboardingSpaceId = _getOnboardingSpaceId as jest.Mock;

jest.mock('features/api-keys-management', () => ({
  getApiKeyRepo: () => mockApiKeyRepo,
}));

jest.mock('ng/spaceContext', () => ({
  resetWithSpace: jest.fn(),
}));

jest.mock('core/services/BrowserStorage', () => ({
  getBrowserStorage: jest.fn(),
}));
const getBrowserStorage = _getBrowserStorage as jest.Mock;

jest.mock('components/shared/auto_create_new_space/CreateModernOnboardingUtils', () => ({
  getStoragePrefix: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
  getOrganizations: jest.fn(),
  getOrganizationSpaces: jest.fn(),
}));
const getOrganizationSpaces = _getOrganizationSpaces as jest.Mock;

jest.mock('utils/ResourceUtils', () => ({
  isLegacyOrganization: jest.fn().mockReturnValue(true),
}));

async function testSpaceScopedPathDeeplinks(link, expected) {
  const space = {
    sys: { id: 'test' },
  };

  getSpaceInfo.mockResolvedValue({
    space,
    spaceId: space.sys.id,
  });

  const result = await resolveLink(link, {});

  expect(spaceContextMock.resetWithSpace).toHaveBeenCalledWith(space);
  expect(result).toEqual({
    params: { spaceId: 'test' },
    path: expected,
  });
}

async function testModernStackOnboardingDeeplinks(link, expected) {
  const space = {
    sys: { id: 'test' },
  };

  (getBrowserStorage as jest.Mock).mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  }));

  getSpaceInfo.mockResolvedValue({
    space,
    spaceId: space.sys.id,
  });
  getOnboardingSpaceId.mockResolvedValue(space.sys.id);

  const result = await resolveLink(link, {});

  expect(result).toEqual({
    params: { spaceId: 'test' },
    path: expected,
  });
}

describe('states/deeplink/resolver', () => {
  beforeEach(() => {
    mockApiKeyRepo.getAll.mockReset();
  });

  it('should give generic error in case no link', async function () {
    const result = await resolveLink(('' as unknown) as LinkType, {});
    expect(result).toEqual({ onboarding: false });
    expect(logger.logException).toHaveBeenCalledWith(expect.any(Error), {
      data: { link: '' },
      groupingHash: 'Error during deeplink redirect',
    });
  });

  describe('#api', () => {
    it('should return to the general api page if no keys', async function () {
      const space = {
        sys: { id: 'test2' },
      };

      getSpaceInfo.mockResolvedValue({
        space,
        spaceId: space.sys.id,
      });
      mockApiKeyRepo.getAll.mockResolvedValue([]);

      canReadApiKeys.mockReturnValue(true);

      const result = await resolveLink(LinkType.API, {});

      expect(spaceContextMock.resetWithSpace).toHaveBeenCalledWith(space);
      expect(result).toEqual({
        path: ['spaces', 'detail', 'api', 'keys', 'list'],
        params: {
          spaceId: 'test2',
        },
      });
    });

    it('should give generic error in case no access', async function () {
      const space = {
        sys: { id: 'test2' },
      };
      getSpaceInfo.mockResolvedValue({
        space,
        spaceId: space.sys.id,
      });
      canReadApiKeys.mockReturnValue(false);
      const result = await resolveLink(LinkType.API, {});
      expect(result).toEqual({ onboarding: false });
    });

    it('should redirect to the last used space', async function () {
      const space = {
        sys: { id: 'test2' },
      };

      getSpaceInfo.mockResolvedValue({
        space,
        spaceId: space.sys.id,
      });
      mockApiKeyRepo.getAll.mockResolvedValue([{ sys: { id: 'api-key-id' } }]);

      canReadApiKeys.mockReturnValue(true);

      const result = await resolveLink(LinkType.API, {});

      expect(spaceContextMock.resetWithSpace).toHaveBeenCalledWith(space);
      expect(result).toEqual({
        path: ['spaces', 'detail', 'api', 'keys', 'detail'],
        params: {
          spaceId: 'test2',
          apiKeyId: 'api-key-id',
        },
      });
    });
  });

  describe('#home', () => {
    it('should redirect the user to space home', async function () {
      await testSpaceScopedPathDeeplinks('home', ['spaces', 'detail', 'home']);
    });
  });

  describe('#general-settings', () => {
    it('should redirect the user to space general settings', async function () {
      await testSpaceScopedPathDeeplinks('general-settings', [
        'spaces',
        'detail',
        'settings',
        'space',
      ]);
    });
  });

  describe('#locales', () => {
    it('should redirect the user to space locale settings', async function () {
      await testSpaceScopedPathDeeplinks('locales', [
        'spaces',
        'detail',
        'settings',
        'locales',
        'list',
      ]);
    });
  });

  describe('#roles-and-permissions', () => {
    it('should redirect the user to space roles settings page', async function () {
      await testSpaceScopedPathDeeplinks('roles-and-permissions', [
        'spaces',
        'detail',
        'settings',
        'roles',
        'list',
      ]);
    });
  });

  describe('#content-preview', () => {
    it('should redirect the user to content previews page', async function () {
      await testSpaceScopedPathDeeplinks('content-preview', [
        'spaces',
        'detail',
        'settings',
        'content_preview',
        'list',
      ]);
    });
  });

  describe('#content', () => {
    it('should redirect the user to entries list page', async function () {
      await testSpaceScopedPathDeeplinks('content', ['spaces', 'detail', 'entries', 'list']);
    });
  });

  describe('#media', () => {
    it('should redirect the user to the assets list page', async function () {
      await testSpaceScopedPathDeeplinks('media', ['spaces', 'detail', 'assets', 'list']);
    });
  });

  describe('#content-model', () => {
    it('should redirect the user to content model page', async function () {
      await testSpaceScopedPathDeeplinks('content-model', [
        'spaces',
        'detail',
        'content_types',
        'list',
      ]);
    });
  });

  describe('#extensions', () => {
    it('should redirect the user to the extensions list page', async function () {
      await testSpaceScopedPathDeeplinks('extensions', [
        'spaces',
        'detail',
        'settings',
        'extensions',
        'list',
      ]);
    });
  });

  describe('#apps', () => {
    it('should redirect user to the install app screen with the url in state params', async function () {
      const space = {
        sys: { id: 'test-space-id' },
      };

      getSpaceInfo.mockResolvedValue({
        space,
        spaceId: space.sys.id,
      });

      const result = await resolveLink(LinkType.Apps, {
        id: 'netlify',
      });

      expect(result).toEqual({
        path: ['spaces', 'detail', 'environment', 'apps', 'list'],
        params: {
          spaceId: 'test-space-id',
          environmentId: 'master',
          app: 'netlify',
          referrer: 'deeplink',
        },
        deeplinkOptions: {
          selectSpace: true,
          selectEnvironment: true,
        },
      });
    });
  });

  describe('appDefinition', () => {
    beforeEach(() => {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(true);
    });

    describe('when an id is provided', () => {
      const id = 'my-app-id';
      it('should redirect the user to the appDefinition management screen for the app id', async () => {
        const result = await resolveLink(LinkType.AppDefinition, { id });
        expect(result).toEqual({
          path: ['account', 'organizations', 'apps', 'definitions'],
          params: {
            orgId: 'some',
            definitionId: 'my-app-id',
          },
          referrer: 'deeplink',
        });
      });

      it('should redirect the user to the correct appDefinition tab', async () => {
        ['events', 'security'].forEach(async (tab) => {
          const result = await resolveLink(LinkType.AppDefinition, { id, tab });
          expect(result).toEqual({
            path: ['account', 'organizations', 'apps', 'definitions'],
            params: {
              orgId: 'some',
              definitionId: 'my-app-id',
              tab,
            },
            referrer: 'deeplink',
          });
        });
      });
    });
    describe('when no id is provided', () => {
      it('should redirect the user to the correct app select screen', async () => {
        ['events', 'security'].forEach(async (tab) => {
          const result = await resolveLink(LinkType.AppDefinition, { tab });
          expect(result).toEqual({
            deeplinkOptions: {
              selectApp: true,
            },
            path: ['account', 'organizations', 'apps', 'definitions'],
            params: {
              orgId: 'some',
              tab,
            },
            referrer: 'deeplink',
          });
        });
      });
    });
  });

  describe('appDefinitionList', () => {
    beforeEach(() => {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(true);
    });

    it('should redirect the user to the appDefinition list for the current org id', async () => {
      const result = await resolveLink(LinkType.AppDefinitionList, {});
      expect(result).toEqual({
        path: ['account', 'organizations', 'apps', 'list'],
        params: {
          orgId: 'some',
        },
      });
    });
  });

  describe('#install-extension', () => {
    it('should redirect user to the install extension screen with the url in state params', async function () {
      const space = {
        sys: { id: 'test-space-id' },
      };

      getSpaceInfo.mockResolvedValue({
        space,
        spaceId: space.sys.id,
      });

      const result = await resolveLink(LinkType.InstallExtension, {
        url: 'https://example.org',
      });

      expect(result).toEqual({
        path: ['spaces', 'detail', 'environment', 'settings', 'extensions', 'list'],
        params: {
          spaceId: 'test-space-id',
          environmentId: 'master',
          extensionUrl: 'https://example.org',
          referrer: 'deeplink',
        },
        deeplinkOptions: {
          selectSpace: true,
          selectEnvironment: true,
        },
      });
    });
  });

  describe('#onboarding-get-started', () => {
    it('should redirect the user to modern stack onboarding getting started page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-get-started', [
        'spaces',
        'detail',
        'onboarding',
        'getStarted',
      ]);
    });
  });

  describe('#onboarding-copy', () => {
    it('should redirect the user to modern stack onboarding clone repo page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-copy', [
        'spaces',
        'detail',
        'onboarding',
        'copy',
      ]);
    });
  });

  describe('#onboarding-explore', () => {
    it('should redirect the user to modern stack onboarding explore content model page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-explore', [
        'spaces',
        'detail',
        'onboarding',
        'explore',
      ]);
    });
  });

  describe('#onboarding-deploy', () => {
    it('should redirect the user to modern stack onboarding deploy app page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-deploy', [
        'spaces',
        'detail',
        'onboarding',
        'deploy',
      ]);
    });
  });

  describe('#invite', () => {
    it('should redirect to invite users page', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(true);

      const result = await resolveLink(LinkType.Invite, {});
      expect(result).toEqual({
        path: ['account', 'organizations', 'users', 'new'],
        params: {
          orgId: 'some',
        },
      });
    });

    it('should give generic error in case no access', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(false);

      const result = await resolveLink(LinkType.Invite, {});
      expect(result).toEqual({
        onboarding: false,
      });
    });
  });

  describe('#users & #subscription & #org', () => {
    it('should redirect to users list page', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(true);

      expect(await resolveLink(LinkType.Users, {})).toEqual({
        path: ['account', 'organizations', 'users', 'list'],
        params: {
          orgId: 'some',
          pathSuffix: '',
        },
      });

      expect(await resolveLink(LinkType.Org, {})).toEqual({
        path: ['account', 'organizations', 'edit'],
        params: {
          orgId: 'some',
          pathSuffix: '',
        },
      });

      expect(await resolveLink(LinkType.Subscription, {})).toEqual({
        path: ['account', 'organizations', 'subscription'],
        params: {
          orgId: 'some',
          pathSuffix: '',
        },
      });
    });

    it('should give generic error in case no access', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(false);

      expect(await resolveLink(LinkType.Invite, {})).toEqual({
        onboarding: false,
      });

      expect(await resolveLink(LinkType.Subscription, {})).toEqual({
        onboarding: false,
      });

      expect(await resolveLink(LinkType.Org, {})).toEqual({
        onboarding: false,
      });
    });
  });

  describe('#invitation-accepted', () => {
    it('should redirect to first space the user has access in the invitation organization', async function () {
      getOrganizationSpaces.mockResolvedValue([
        {
          sys: { id: 'testSpaceId1' },
          organization: { sys: { id: 'testOrgId' } },
        },
        {
          sys: { id: 'testSpaceId2' },
          organization: { sys: { id: 'testOrgId' } },
        },
      ]);

      expect(await resolveLink(LinkType.InvitationAccepted, { orgId: 'testOrgId' })).toEqual({
        path: ['spaces', 'detail', 'home'],
        params: {
          spaceId: 'testSpaceId1',
        },
      });
    });
    it('should redirect to home if there are no accessible spaces in the invitation organization', async function () {
      getOrganizationSpaces.mockResolvedValue([]);

      expect(await resolveLink(LinkType.InvitationAccepted, { orgId: 'testOrgId' })).toEqual({
        path: ['home'],
        params: {
          orgId: 'testOrgId',
          orgOwnerOrAdmin: false,
        },
      });
    });
  });

  describe('#tags', () => {
    it('should redirect the user to space tags settings', async function () {
      await testSpaceScopedPathDeeplinks('tags', ['spaces', 'detail', 'settings', 'tags']);
    });
  });
});