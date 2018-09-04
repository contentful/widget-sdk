import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('CreateModernOnboarding service', function() {
  beforeEach(function() {
    module('contentful/test', $provide => {
      this.getAllKeys = sinon.stub();
      this.createKey = sinon.stub();
      this.createCMAKey = sinon.stub();
      this.user$ = K.createMockProperty({ sys: { id: 'someUser' } });
      $provide.value('spaceContext', {
        apiKeyRepo: {
          getAll: this.getAllKeys,
          create: this.createKey
        }
      });
      $provide.value('services/TokenStore.es6', {
        user$: this.user$
      });
      $provide.value('app/api/CMATokens/Resource.es6', {
        create: () => ({ create: this.createCMAKey })
      });
    });

    this.CreateModernOnboarding = this.$inject('createModernOnboarding');
  });

  describe('getUser', function() {
    it('should return given user', function() {
      expect(this.CreateModernOnboarding.getUser()).toEqual(K.getValue(this.user$));
    });
  });

  describe('getStoragePrefix', function() {
    it('should return the localStorage prefix used by modern stack onboarding', function() {
      expect(this.CreateModernOnboarding.getStoragePrefix()).toEqual(
        `ctfl:someUser:modernStackOnboarding`
      );
    });
  });

  describe('getDeliveryToken', function() {
    it('should return a first key from the list', async function() {
      const key = { accessToken: 'some' };
      this.getAllKeys.returns(Promise.resolve([key]));
      const deliveryToken = await this.CreateModernOnboarding.getDeliveryToken();

      expect(deliveryToken).toBe(key.accessToken);
    });

    it('should create a new key if list is empty', async function() {
      const key = { accessToken: 'newly created key' };
      this.getAllKeys.returns(Promise.resolve([]));
      this.createKey.returns(Promise.resolve(key));
      const deliveryToken = await this.CreateModernOnboarding.getDeliveryToken();

      expect(deliveryToken).toBe(key.accessToken);
    });
  });

  describe('getManagementToken', function() {
    it('should create a new token if does not exist yet', async function() {
      const originalCreateManagementToken = this.CreateModernOnboarding.createManagementToken;
      this.CreateModernOnboarding.createManagementToken = sinon.spy();

      await this.CreateModernOnboarding.getManagementToken();

      expect(this.CreateModernOnboarding.createManagementToken.calledOnce).toBe(true);

      this.CreateModernOnboarding.createManagementToken = originalCreateManagementToken;
    });

    it('should get a created token', async function() {
      const cmaKey = { token: 'newly created CMA token' };
      this.createCMAKey.returns(Promise.resolve(cmaKey));
      await this.CreateModernOnboarding.createManagementToken();
      const receivedToken = await this.CreateModernOnboarding.getManagementToken();

      expect(receivedToken).toBe(cmaKey.token);
    });
  });
});
