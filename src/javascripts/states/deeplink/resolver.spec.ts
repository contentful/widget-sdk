import { captureError } from 'core/monitoring';
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
import { routes } from 'core/react-routing';

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

async function testSpaceScopedPathDeeplinks(
  link,
  expected: { path: string | string[]; params?: any }
) {
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
    params: { spaceId: 'test', ...expected.params },
    path: expected.path,
  });
}

async function testModernStackOnboardingDeeplinks(link, expectedPathname) {
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
    params: { spaceId: 'test', pathname: expectedPathname },
    path: 'spaces.detail.onboarding',
  });
}

describe('states/deeplink/resolver', () => {
  beforeEach(() => {
    mockApiKeyRepo.getAll.mockReset();
  });

  it('should give generic error in case no link', async function () {
    const result = await resolveLink('' as unknown as LinkType, {});
    expect(result).toEqual({ error: expect.any(Error) });
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), {
      extra: {
        link: '',
      },
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
      expect(result).toEqual(
        routes['api.keys.list']({ withEnvironment: false }, { spaceId: 'test2' })
      );
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

      expect(result).toEqual({ error: expect.any(Error) });
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
      expect(result).toEqual(
        routes['api.keys.detail'](
          { withEnvironment: false },
          { apiKeyId: 'api-key-id', spaceId: 'test2' }
        )
      );
    });
  });

  describe('#home', () => {
    it('should redirect the user to space home', async function () {
      await testSpaceScopedPathDeeplinks('home', { path: 'spaces.detail.home' });
    });
  });

  describe('#general-settings', () => {
    it('should redirect the user to space general settings', async function () {
      await testSpaceScopedPathDeeplinks('general-settings', {
        path: ['spaces', 'detail', 'settings', 'space'],
      });
    });
  });

  describe('#locales', () => {
    it('should redirect the user to space locale settings', async function () {
      await testSpaceScopedPathDeeplinks(
        'locales',
        routes['locales.list']({ withEnvironment: false })
      );
    });
  });

  describe('#roles-and-permissions', () => {
    it('should redirect the user to space roles settings page', async function () {
      await testSpaceScopedPathDeeplinks(
        'roles-and-permissions',
        routes['roles.list']({ withEnvironment: false })
      );
    });
  });

  describe('#content-preview', () => {
    it('should redirect the user to content previews page', async function () {
      await testSpaceScopedPathDeeplinks(
        'content-preview',
        routes['content_preview.list']({ withEnvironment: false })
      );
    });
  });

  describe('#content', () => {
    it('should redirect the user to entries list page', async function () {
      await testSpaceScopedPathDeeplinks('content', {
        path: ['spaces', 'detail', 'entries', 'list'],
      });
    });
  });

  describe('#media', () => {
    it('should redirect the user to the assets list page', async function () {
      await testSpaceScopedPathDeeplinks(
        'media',
        routes['assets.list']({ withEnvironment: false })
      );
    });
  });

  describe('#content-model', () => {
    it('should redirect the user to content model page', async function () {
      await testSpaceScopedPathDeeplinks(
        'content-model',
        routes['content_types.list']({ withEnvironment: false })
      );
    });
  });

  describe('#extensions', () => {
    it('should redirect the user to the extensions list page', async function () {
      await testSpaceScopedPathDeeplinks(
        'extensions',
        routes['extensions.list']({ withEnvironment: false })
      );
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

      const route = routes['apps.list'](
        { withEnvironment: false },
        {
          spaceId: 'test-space-id',
          environmentId: 'master',
          app: 'netlify',
          navigationState: {
            referrer: 'deeplink',
          },
        }
      );

      expect(result).toEqual({
        path: route.path,
        params: route.params,
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
          path: 'account.organizations',
          params: {
            pathname: '/some/apps/definitions/my-app-id/general',
          },
          referrer: 'deeplink',
        });
      });

      it('should redirect the user to the correct appDefinition tab', async () => {
        ['events', 'security'].forEach(async (tab) => {
          const result = await resolveLink(LinkType.AppDefinition, { id, tab });
          expect(result).toEqual({
            path: 'account.organizations',
            params: {
              pathname: `/some/apps/definitions/my-app-id/${tab}`,
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
            path: 'account.organizations',
            params: {
              pathname: `/some/apps/definitions//${tab}`,
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
        path: 'account.organizations',
        params: {
          pathname: '/some/apps',
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

      const route = routes['extensions.list'](
        { withEnvironment: true },
        {
          navigationState: {
            extensionUrl: 'https://example.org',
            referrer: 'deeplink',
          },
        }
      );

      expect(result).toEqual({
        path: route.path,
        params: {
          spaceId: 'test-space-id',
          environmentId: 'master',
          ...route.params,
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
      await testModernStackOnboardingDeeplinks('onboarding-get-started', '/getStarted');
    });
  });

  describe('#onboarding-copy', () => {
    it('should redirect the user to modern stack onboarding clone repo page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-copy', '/copy');
    });
  });

  describe('#onboarding-explore', () => {
    it('should redirect the user to modern stack onboarding explore content model page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-explore', '/explore');
    });
  });

  describe('#onboarding-deploy', () => {
    it('should redirect the user to modern stack onboarding deploy app page', async function () {
      await testModernStackOnboardingDeeplinks('onboarding-deploy', '/deploy');
    });
  });

  describe('#invite', () => {
    it('should redirect to invite users page', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(true);

      const result = await resolveLink(LinkType.Invite, {});
      expect(result).toEqual(routes['organizations.users.invite']({}, { orgId: 'some' }));
    });

    it('should give generic error in case no access', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(false);

      const result = await resolveLink(LinkType.Invite, {});

      expect(result).toEqual({ error: expect.any(Error) });
    });
  });

  describe('#users & #subscription & #org', () => {
    it('should redirect to users list page', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(true);

      expect(await resolveLink(LinkType.Users, {})).toEqual(
        routes['organizations.users.list']({}, { orgId: 'some' })
      );

      expect(await resolveLink(LinkType.Org, {})).toEqual(
        routes['organizations.edit']({}, { orgId: 'some' })
      );

      expect(await resolveLink(LinkType.Subscription, {})).toEqual(
        routes['organizations.subscription_v1']({}, { orgId: 'some' })
      );
    });

    it('should give generic error in case no access', async function () {
      getOrg.mockResolvedValue({ orgId: 'some' });
      checkOrgAccess.mockResolvedValue(false);

      expect(await resolveLink(LinkType.Invite, {})).toEqual({ error: expect.any(Error) });

      expect(await resolveLink(LinkType.Subscription, {})).toEqual({ error: expect.any(Error) });

      expect(await resolveLink(LinkType.Org, {})).toEqual({ error: expect.any(Error) });
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
        path: 'spaces.detail.home',
        params: {
          spaceId: 'testSpaceId1',
          pathname: '/',
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
      await testSpaceScopedPathDeeplinks('tags', routes['tags']({ withEnvironment: false }));
    });
  });
});
