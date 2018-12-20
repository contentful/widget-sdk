import * as sinon from 'test/helpers/sinon';
import * as K from 'test/helpers/mocks/kefir';
import { noop } from 'lodash';

describe('states/deeplink/utils.es6', () => {
  beforeEach(function() {
    this.storeGet = sinon.stub();
    this.storeSet = sinon.stub();
    this.getSpaces = sinon.stub();
    this.getOrganizations = sinon.stub();
    this.user$ = K.createMockProperty(null);
    this.modernStackName = 'modern stack name';
    module('contentful/test', $provide => {
      $provide.value('TheStore', {
        getStore: () => {
          return {
            get: this.storeGet,
            forKey: noop,
            set: this.storeSet
          };
        }
      });
      $provide.value('services/TokenStore.es6', {
        getSpaces: this.getSpaces,
        getOrganizations: this.getOrganizations,
        user$: this.user$
      });
      $provide.value('components/shared/auto_create_new_space', {
        getKey: noop
      });
      $provide.value('components/shared/auto_create_new_space/CreateModernOnboarding.es6', {
        getStoragePrefix: noop,
        MODERN_STACK_ONBOARDING_SPACE_NAME: this.modernStackName
      });
    });

    this.utils = this.$inject('states/deeplink/utils.es6');
  });

  describe('#getOnboardingSpaceId', () => {
    it('takes spaceId from local storage', function*() {
      this.getSpaces.resolves([{ sys: { id: 'some_id' } }]);
      this.user$.set({ sys: { id: 'user_id' } });
      this.storeGet.returns('some_id');
      const spaceId = yield* this.utils.getOnboardingSpaceId();

      expect(spaceId).toBe('some_id');
    });

    it('looks for spaces with modern stack onboarding name if no value in local storage', function*() {
      this.getSpaces.resolves([{ sys: { id: 'another_id' }, name: this.modernStackName }]);
      this.user$.set({ sys: { id: 'user_id' } });

      const spaceId = yield* this.utils.getOnboardingSpaceId();
      expect(spaceId).toBe('another_id');
    });

    it('sets defaults to local storage if space id was not in local storage', function*() {
      this.getSpaces.resolves([{ sys: { id: 'another_id' }, name: this.modernStackName }]);
      this.user$.set({ sys: { id: 'user_id' } });

      yield* this.utils.getOnboardingSpaceId();
      expect(this.storeSet.callCount).toBeGreaterThan(0);
    });

    it('returns undefined if there is no space from local storage and no space with name', function*() {
      this.getSpaces.resolves([
        { sys: { id: 'another_id' }, name: `${this.modernStackName} and some text` }
      ]);
      this.user$.set({ sys: { id: 'user_id' } });
      this.storeGet.returns('some_id');

      const spaceId = yield* this.utils.getOnboardingSpaceId();
      expect(spaceId).toBe(undefined);
    });
  });

  describe('#getSpaceInfo', () => {
    it('checks value in the store', function*() {
      this.storeGet.returns('some_id');
      this.getSpaces.resolves([{ sys: { id: 'some_id' } }]);
      yield* this.utils.getSpaceInfo();

      expect(this.storeGet.calledOnce).toBe(true);
    });

    it('returns spaceId from the store', function*() {
      this.storeGet.returns('some_id');
      this.getSpaces.resolves([{ sys: { id: 'some_id' } }]);
      const { spaceId } = yield* this.utils.getSpaceInfo();

      expect(spaceId).toBe('some_id');
    });

    it('returns a new spaceId if we have invalid in the store', function*() {
      this.storeGet.returns('some_id');
      this.getSpaces.resolves([{ sys: { id: 'new_id' } }]);

      const { spaceId } = yield* this.utils.getSpaceInfo();
      expect(spaceId).toBe('new_id');
    });

    it('throws an error if there are no spaces', function*() {
      this.getSpaces.resolves([]);
      let hasError = false;

      try {
        yield* this.utils.getSpaceInfo();
      } catch (e) {
        hasError = true;
        expect(e.message).toBeTruthy();
      }

      // check that error actually was caught
      expect(hasError).toBe(true);
    });
  });

  describe('#getOrg', () => {
    it('returns orgId from the store', function*() {
      const returnedOrg = { sys: { id: 'some_org_id' }, pricing: 'old' };
      this.storeGet.returns(returnedOrg.sys.id);

      this.getOrganizations.resolves([returnedOrg]);
      const { orgId, org } = yield* this.utils.getOrg();

      expect(orgId).toBe(returnedOrg.sys.id);
      expect(org).toBe(returnedOrg);
    });

    it('returns org from the selected space', function*() {
      const spaceOrg = { sys: { id: 'some_new_org_id' } };
      this.storeGet.returns('some_org_id');
      this.getOrganizations.resolves([]);
      this.getSpaces.resolves([
        {
          organization: spaceOrg,
          sys: { id: 'some_space_id' }
        }
      ]);
      const { orgId, org } = yield* this.utils.getOrg();

      expect(orgId).toBe(spaceOrg.sys.id);
      expect(org).toBe(spaceOrg);
    });
  });
});
