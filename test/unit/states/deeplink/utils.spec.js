import * as sinon from 'helpers/sinon';
import {noop} from 'lodash';

describe('states/deeplink/utils', function () {
  beforeEach(function () {
    this.storeGet = sinon.stub();
    this.getSpace = sinon.stub();
    this.getSpaces = sinon.stub();
    this.getOrganization = sinon.stub();
    module('contentful/test', ($provide) => {
      $provide.value('TheStore', {
        get: this.storeGet,
        forKey: noop
      });
      $provide.value('services/TokenStore', {
        getSpace: this.getSpace,
        getSpaces: this.getSpaces,
        getOrganization: this.getOrganization
      });
    });

    this.utils = this.$inject('states/deeplink/utils');
  });

  describe('#getSpaceInfo', function () {
    it('checks value in the store', function* () {
      this.storeGet.returns('some_id');
      yield* this.utils.getSpaceInfo();

      expect(this.storeGet.calledOnce).toBe(true);
    });

    it('returns spaceId from the store', function* () {
      this.storeGet.returns('some_id');
      const { spaceId } = yield* this.utils.getSpaceInfo();

      expect(spaceId).toBe('some_id');
    });

    it('returns a new spaceId if we have invalid in the store', function* () {
      this.storeGet.returns('some_id');
      this.getSpace.onFirstCall().returns(Promise.reject(new Error('Something!!!')));
      const spaces = [{ something: true, sys: { id: 'new_id' } }];
      this.getSpaces.returns(Promise.resolve(spaces));
      this.getSpace.onSecondCall().returns(Promise.resolve({
        data: { sys: { id: 'new_id' } }
      }));

      const { spaceId } = yield* this.utils.getSpaceInfo();
      expect(spaceId).toBe('new_id');
    });

    it('throws an error if there are no spaces', function* () {
      this.getSpaces.returns(Promise.resolve([]));
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

  describe('#getOrg', function () {
    it('returns orgId from the store', function* () {
      this.storeGet.returns('some_org_id');
      const { orgId } = yield* this.utils.getOrg();

      expect(orgId).toBe('some_org_id');
    });

    it('returns org from the selected space', function* () {
      this.storeGet.returns('some_org_id');
      this.getSpace.returns(Promise.resolve({
        getOrganizationId: () => 'some_new_org_id'
      }));
      this.getOrganization.returns(Promise.reject(new Error('no org with this id')));
      const { orgId } = yield* this.utils.getOrg();

      expect(orgId).toBe('some_new_org_id');
    });
  });
});
