import * as sinon from 'helpers/sinon';
import {noop} from 'lodash';

describe('states/deeplink/utils', () => {
  beforeEach(function () {
    this.storeGet = sinon.stub();
    this.getSpaces = sinon.stub();
    this.getOrganizations = sinon.stub();
    module('contentful/test', ($provide) => {
      $provide.value('TheStore', {
        getStore: () => {
          return {
            get: this.storeGet,
            forKey: noop
          };
        }
      });
      $provide.value('services/TokenStore', {
        getSpaces: this.getSpaces,
        getOrganizations: this.getOrganizations
      });
      $provide.value('components/shared/auto_create_new_space', {});
      $provide.value('createModernOnboarding', {});
    });

    this.utils = this.$inject('states/deeplink/utils');
  });

  describe('#getSpaceInfo', () => {
    it('checks value in the store', function* () {
      this.storeGet.returns('some_id');
      this.getSpaces.resolves([{ sys: { id: 'some_id' } }]);
      yield* this.utils.getSpaceInfo();

      expect(this.storeGet.calledOnce).toBe(true);
    });

    it('returns spaceId from the store', function* () {
      this.storeGet.returns('some_id');
      this.getSpaces.resolves([{ sys: { id: 'some_id' } }]);
      const { spaceId } = yield* this.utils.getSpaceInfo();

      expect(spaceId).toBe('some_id');
    });

    it('returns a new spaceId if we have invalid in the store', function* () {
      this.storeGet.returns('some_id');
      this.getSpaces.resolves([{ sys: { id: 'new_id' } }]);

      const { spaceId } = yield* this.utils.getSpaceInfo();
      expect(spaceId).toBe('new_id');
    });

    it('throws an error if there are no spaces', function* () {
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
    it('returns orgId from the store', function* () {
      const returnedOrg = { sys: { id: 'some_org_id' }, pricing: 'old' };
      this.storeGet.returns(returnedOrg.sys.id);

      this.getOrganizations.resolves([returnedOrg]);
      const { orgId, org } = yield* this.utils.getOrg();

      expect(orgId).toBe(returnedOrg.sys.id);
      expect(org).toBe(returnedOrg);
    });

    it('returns org from the selected space', function* () {
      const spaceOrg = {sys: {id: 'some_new_org_id'}};
      this.storeGet.returns('some_org_id');
      this.getOrganizations.resolves([]);
      this.getSpaces.resolves([
        {
          organization: spaceOrg,
          sys: {id: 'some_space_id'}
        }
      ]);
      const { orgId, org } = yield* this.utils.getOrg();

      expect(orgId).toBe(spaceOrg.sys.id);
      expect(org).toBe(spaceOrg);
    });
  });
});
