import * as K from '../../../../../test/utils/kefir';
import * as TokenStore from 'services/TokenStore';
import * as ApiKeysManagement from 'features/api-keys-management';
import * as CreateModernOnboardingUtils from './CreateModernOnboardingUtils';

jest.mock('services/TokenStore');
jest.mock('features/api-keys-management');

describe('CreateModernOnboarding service', function () {
  let createCMAKey, user$, apiKeyRepo;
  beforeEach(async function () {
    createCMAKey = jest.fn().mockReturnValue({ token: 'token' });
    user$ = K.createMockProperty({ sys: { id: 'someUser' } });

    apiKeyRepo = {
      getAll: jest.fn(),
      create: jest.fn(),
    };

    TokenStore.user$ = user$;

    ApiKeysManagement.getApiKeyRepo = () => apiKeyRepo;
    ApiKeysManagement.purgeApiKeyRepoCache = () => {};
    ApiKeysManagement.TokenResourceManager = {
      createToken: () => ({ create: createCMAKey }),
    };
  });

  describe('getUser', function () {
    it('should return given user', function () {
      expect(CreateModernOnboardingUtils.getUser()).toEqual(K.getValue(user$));
    });
  });

  describe('getStoragePrefix', function () {
    it('should return the localStorage prefix used by modern stack onboarding', function () {
      expect(CreateModernOnboardingUtils.getStoragePrefix()).toEqual(
        `ctfl:someUser:modernStackOnboarding`
      );
    });
  });

  describe('getDeliveryToken', function () {
    it('should return a first key from the list', async function () {
      const key = { accessToken: 'some' };
      apiKeyRepo.getAll.mockResolvedValue([key]);
      const deliveryToken = await CreateModernOnboardingUtils.getDeliveryToken();

      expect(deliveryToken).toBe(key.accessToken);
    });

    it('should create a new key if list is empty', async function () {
      const key = { accessToken: 'newly created key' };
      apiKeyRepo.getAll.mockResolvedValue([]);
      apiKeyRepo.create.mockResolvedValue(key);
      const deliveryToken = await CreateModernOnboardingUtils.getDeliveryToken();

      expect(deliveryToken).toBe(key.accessToken);
    });
  });

  describe('getManagementToken', function () {
    it('should create a new token if does not exist yet', async function () {
      expect(await CreateModernOnboardingUtils.getManagementToken()).toBe('token');
    });

    it('should get a created token', async function () {
      const cmaKey = { token: 'newly created CMA token' };
      createCMAKey.mockResolvedValue(cmaKey);
      await CreateModernOnboardingUtils.createManagementToken();
      const receivedToken = await CreateModernOnboardingUtils.getManagementToken();

      expect(receivedToken).toBe(cmaKey.token);
    });
  });
});
