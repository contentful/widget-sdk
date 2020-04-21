import { getOrg, getSpaceInfo, getOnboardingSpaceId } from './utils';
import { getStore } from 'browserStorage';
import * as TokenStore from 'services/TokenStore';

jest.mock('browserStorage', () => ({ getStore: jest.fn() }));

jest.mock('services/TokenStore', () => {
  const Kefir = require('core/utils/kefir');

  function createMockKefirProperty(initial) {
    const { property, end, set, error } = Kefir.createPropertyBus(initial);
    property.end = end;
    property.set = set;
    property.error = error;
    return property;
  }

  return {
    getSpaces: jest.fn(),
    getOrganizations: jest.fn(),
    user$: createMockKefirProperty(null),
  };
});

jest.mock('components/shared/auto_create_new_space/CreateModernOnboardingUtils', () => ({
  getStoragePrefix: jest.fn().mockReturnValue('prefix'),
  MODERN_STACK_ONBOARDING_SPACE_NAME: 'modern stack name',
}));

describe('states/deeplink/utils', () => {
  describe('#getOrg', () => {
    it('returns orgId from the store', async function () {
      const returnedOrg = { sys: { id: 'some_org_id' }, pricing: 'old' };

      getStore.mockImplementation(() => ({
        get: jest.fn().mockReturnValue(returnedOrg.sys.id),
      }));
      TokenStore.getOrganizations.mockResolvedValue([returnedOrg]);

      const { orgId, org } = await getOrg();
      expect(orgId).toBe(returnedOrg.sys.id);
      expect(org).toBe(returnedOrg);
    });
    it('returns org from the selected space', async function () {
      const spaceOrg = { sys: { id: 'some_new_org_id' } };

      getStore.mockImplementation(() => ({
        get: jest.fn().mockReturnValue('some_org_id'),
      }));
      TokenStore.getOrganizations.mockResolvedValue([]);
      TokenStore.getSpaces.mockResolvedValue([
        { organization: spaceOrg, sys: { id: 'some_space_id' } },
      ]);

      const { orgId, org } = await getOrg();
      expect(orgId).toBe(spaceOrg.sys.id);
      expect(org).toBe(spaceOrg);
    });
  });

  describe('#getSpaceInfo', () => {
    it('checks value in the store', async function () {
      const getFn = jest.fn().mockReturnValue('some_id');

      getStore.mockImplementation(() => ({
        get: getFn,
      }));

      TokenStore.getSpaces.mockResolvedValue([{ sys: { id: 'some_id' } }]);

      const { spaceId } = await getSpaceInfo();

      expect(getFn).toHaveBeenCalledTimes(1);
      expect(getFn).toHaveBeenCalledWith('lastUsedSpace');
      expect(spaceId).toEqual('some_id');
    });

    it('returns a new spaceId if we have invalid in the store', async function () {
      getStore.mockImplementation(() => ({
        get: jest.fn().mockReturnValue('some_id'),
      }));

      TokenStore.getSpaces.mockResolvedValue([{ sys: { id: 'new_id' } }]);

      const { spaceId } = await getSpaceInfo();
      expect(spaceId).toBe('new_id');
    });
    it('throws an error if there are no spaces', async function () {
      getStore.mockImplementation(() => ({
        get: jest.fn().mockReturnValue('some_id'),
      }));
      TokenStore.getSpaces.mockResolvedValue([]);

      let hasError = false;
      try {
        await getSpaceInfo();
      } catch (e) {
        hasError = true;
        expect(e.message).toBeTruthy();
      }
      expect(hasError).toBe(true);
    });
  });

  describe('#getOnboardingSpaceId', () => {
    it('takes spaceId from local storage', async function () {
      const storeGetFn = jest.fn().mockReturnValue('some_id');
      getStore.mockImplementation(() => ({
        set: jest.fn(),
        get: storeGetFn,
      }));
      TokenStore.getSpaces.mockResolvedValue([{ sys: { id: 'some_id' } }]);
      TokenStore.user$.set({ sys: { id: 'user_id' } });
      const spaceId = await getOnboardingSpaceId();
      expect(spaceId).toBe('some_id');
      expect(storeGetFn).toHaveBeenCalledWith('prefix:developerChoiceSpace');
    });
    it('looks for spaces with modern stack onboarding name if no value in local storage', async function () {
      const storeSetFn = jest.fn();
      getStore.mockImplementation(() => ({
        set: storeSetFn,
        get: jest.fn().mockReturnValue(undefined),
      }));
      TokenStore.getSpaces.mockResolvedValue([
        { sys: { id: 'another_id' }, name: 'modern stack name' },
      ]);
      TokenStore.user$.set({ sys: { id: 'user_id' } });

      const spaceId = await getOnboardingSpaceId();
      expect(spaceId).toBe('another_id');
      expect(storeSetFn).toHaveBeenCalledTimes(2);
      expect(storeSetFn).toHaveBeenCalledWith('prefix:developerChoiceSpace', 'another_id');
      expect(storeSetFn).toHaveBeenCalledWith('ctfl:user_id:spaceAutoCreated', true);
    });
    it('returns undefined if there is no space from local storage and no space with name', async function () {
      getStore.mockImplementation(() => ({
        set: jest.fn(),
        get: jest.fn().mockReturnValue('some_id'),
      }));

      TokenStore.getSpaces.mockResolvedValue([
        { sys: { id: 'another_id' }, name: `${this.modernStackName} and some text` },
      ]);
      TokenStore.user$.set({ sys: { id: 'user_id' } });

      const spaceId = await getOnboardingSpaceId();
      expect(spaceId).toBeUndefined();
    });
  });
});
