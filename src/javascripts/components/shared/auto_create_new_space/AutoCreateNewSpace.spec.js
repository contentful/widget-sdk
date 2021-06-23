import * as K from '__mocks__/kefirMock';

import * as TokenStore from 'services/TokenStore';
import * as CreateModernOnboarding from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import * as BrowserStorage from 'core/services/BrowserStorage';

import { init, resetCreatingSampleSpace } from './index';
import { waitFor } from '@testing-library/dom';
import { getVariation } from 'core/feature-flags';
import { isDeveloper } from 'features/onboarding';

jest.mock('services/TokenStore');
jest.mock('features/onboarding', () => ({
  isDeveloper: jest.fn(),
}));

jest.mock('components/shared/auto_create_new_space/CreateModernOnboarding');
jest.mock('core/services/BrowserStorage');
jest.unmock('classes/spaceContext');

jest.mock('core/NgRegistry', () => ({
  getModule: (arg) =>
    arg === '$stateParams' ? { orgId: 'org' } : jest.requireActual('core/NgRegistry').getModule,
}));

jest.mock('analytics/Analytics', () => ({
  defaultEventProps: jest.fn(),
  tracking: {
    experimentStarted: jest.fn(),
  },
}));

describe('AutoCreateNewSpace', () => {
  let createModernStackOnboarding, tokenStore, store, user, spacesByOrg, org;

  beforeEach(function () {
    getVariation.mockReturnValue(false);
    createModernStackOnboarding = jest.fn().mockResolvedValue();
    store = {
      set: jest.fn(),
      get: jest.fn().mockReturnValue(false),
      forKey: jest.fn(),
    };
    tokenStore = {
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null),
      organizations$: K.createMockProperty([]),
    };

    CreateModernOnboarding.create = createModernStackOnboarding;

    user = {
      sys: { id: 'user', createdAt: new Date().toISOString() },
      organizationMemberships: [
        {
          role: 'owner',
          organization: {
            sys: { id: 'orgId1' },
          },
        },
        {
          role: 'admin',
          organization: {
            sys: { id: 'orgId2' },
          },
        },
      ],
    };
    spacesByOrg = {};
    org = {
      sys: {
        createdBy: user,
      },
    };

    BrowserStorage.getBrowserStorage = jest.fn().mockReturnValue(store);

    TokenStore.user$ = tokenStore.user$;
    TokenStore.spacesByOrganization$ = tokenStore.spacesByOrganization$;
    TokenStore.organizations$ = tokenStore.organizations$;

    // set data to qualify user
    TokenStore.spacesByOrganization$.set(spacesByOrg);
    TokenStore.organizations$.set([org]);
    TokenStore.user$.set(user);
    isDeveloper.mockReturnValue(false);

    resetCreatingSampleSpace();
  });

  describe('#init', () => {
    it('should be a noop when user is falsy', function () {
      tokenStore.organizations$.set([{ sys: { id: 'org' } }]);
      tokenStore.spacesByOrganization$.set({
        org: ['space'],
      });
      tokenStore.user$.set(null);
      init();
      expect(createModernStackOnboarding).not.toHaveBeenCalled();
    });

    it('should be a noop when spacesByOrg is falsy', function () {
      tokenStore.user$.set({});
      tokenStore.spacesByOrganization$.set(null);
      init();
      expect(createModernStackOnboarding).not.toHaveBeenCalled();
    });

    it('should be a noop and not fail when user has no org', function () {
      tokenStore.organizations$.set([]);
      tokenStore.spacesByOrganization$.set({
        org: ['space'],
      });
      tokenStore.user$.set({ sys: { id: 'user' } });
      init();
      expect(createModernStackOnboarding).not.toHaveBeenCalled();
    });

    describe('qualifyUser', () => {
      // specs
      [
        [() => store.get.mockReturnValue(true), 'space was already auto created for the user'],
        [
          () => tokenStore.spacesByOrganization$.set({ orgId: ['spaceId'] }),
          'the user has an org with spaces',
        ],
        [
          () => {
            user.organizationMemberships[0].role = 'potato';
            tokenStore.user$.set(user);
          },
          'the user does not own any orgs',
        ],
      ].forEach(testQualification);

      function testQualification([fn, msg]) {
        it(`should be a noop if ${msg}`, async function () {
          fn();
          init();
          await waitFor(() => expect(createModernStackOnboarding).not.toHaveBeenCalled());
        });
      }
    });

    it('should create a sample space when the user is qualified', async function () {
      tokenStore.spacesByOrganization$.set(spacesByOrg);
      tokenStore.user$.set(user);
      store.get.mockReturnValue(false);
      init();
      await waitFor(() => expect(createModernStackOnboarding).toHaveBeenCalledTimes(1));
      expect(createModernStackOnboarding).toHaveBeenCalledWith({
        markOnboarding: expect.any(Function),
        onDefaultChoice: expect.any(Function),
        org: {
          sys: { id: 'orgId1' },
        },
        user: user,
      });
    });

    it('should only call create sample space function once even if invoked multiple times', async function () {
      // to prevent createModernStackOnboarding from resolving before
      // the next user$ and spacesByOrganization$ values are emitted
      const delayedPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      createModernStackOnboarding.mockResolvedValue(delayedPromise);

      init();
      user.sys = { id: '123', createdAt: new Date(2017, 8, 24).toISOString() };
      tokenStore.user$.set(user);
      init();

      await waitFor(() => expect(createModernStackOnboarding).toHaveBeenCalledTimes(1));
    });
  });
});
