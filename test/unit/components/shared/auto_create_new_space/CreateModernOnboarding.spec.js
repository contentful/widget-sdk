import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import { $initialize } from 'test/utils/ng';

describe('CreateModernOnboarding service', function () {
  beforeEach(async function () {
    this.createCMAKey = sinon.stub().returns({ token: 'token' });
    this.user$ = K.createMockProperty({ sys: { id: 'someUser' } });

    this.apiKeyRepo = {
      getAll: sinon.stub(),
      create: sinon.stub(),
    };

    this.system.set('services/TokenStore', {
      user$: this.user$,
    });

    this.system.set('app/settings/api/services/ApiKeyRepoInstance', {
      getApiKeyRepo: () => this.apiKeyRepo,
      purgeApiKeyRepoCache: () => {},
    });

    this.system.set('app/settings/api/cma-tokens/TokenResourceManager', {
      create: () => ({ create: this.createCMAKey }),
    });

    this.CreateModernOnboardingUtils = await this.system.import(
      'components/shared/auto_create_new_space/CreateModernOnboardingUtils'
    );

    await $initialize(this.system);
  });

  describe('getUser', function () {
    it('should return given user', function () {
      expect(this.CreateModernOnboardingUtils.getUser()).toEqual(K.getValue(this.user$));
    });
  });

  describe('getStoragePrefix', function () {
    it('should return the localStorage prefix used by modern stack onboarding', function () {
      expect(this.CreateModernOnboardingUtils.getStoragePrefix()).toEqual(
        `ctfl:someUser:modernStackOnboarding`
      );
    });
  });

  describe('getDeliveryToken', function () {
    it('should return a first key from the list', async function () {
      const key = { accessToken: 'some' };
      this.apiKeyRepo.getAll.returns(Promise.resolve([key]));
      const deliveryToken = await this.CreateModernOnboardingUtils.getDeliveryToken();

      expect(deliveryToken).toBe(key.accessToken);
    });

    it('should create a new key if list is empty', async function () {
      const key = { accessToken: 'newly created key' };
      this.apiKeyRepo.getAll.returns(Promise.resolve([]));
      this.apiKeyRepo.create.returns(Promise.resolve(key));
      const deliveryToken = await this.CreateModernOnboardingUtils.getDeliveryToken();

      expect(deliveryToken).toBe(key.accessToken);
    });
  });

  describe('getManagementToken', function () {
    it('should create a new token if does not exist yet', async function () {
      expect(await this.CreateModernOnboardingUtils.getManagementToken()).toBe('token');
    });

    it('should get a created token', async function () {
      const cmaKey = { token: 'newly created CMA token' };
      this.createCMAKey.returns(Promise.resolve(cmaKey));
      await this.CreateModernOnboardingUtils.createManagementToken();
      const receivedToken = await this.CreateModernOnboardingUtils.getManagementToken();

      expect(receivedToken).toBe(cmaKey.token);
    });
  });
});
