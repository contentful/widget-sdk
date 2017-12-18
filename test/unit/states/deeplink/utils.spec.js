import * as sinon from 'helpers/sinon';
import {noop} from 'lodash';

describe('states/deeplink/utils', function () {
  beforeEach(function () {
    this.storeGet = sinon.stub();
    this.getFatSpaces = sinon.stub();
    this.getOrganizations = sinon.stub();
    module('contentful/test', ($provide) => {
      $provide.value('TheStore', {
        get: this.storeGet,
        forKey: noop
      });
      $provide.value('services/TokenStore', {
        getFatSpaces: this.getFatSpaces,
        getOrganizations: this.getOrganizations
      });
    });

    this.utils = this.$inject('states/deeplink/utils');
  });

  describe('#getSpaceInfo', function () {
    it('checks value in the store', function* () {
      this.storeGet.returns('some_id');
      this.getFatSpaces.returns(Promise.resolve([{ data: { sys: { id: 'some_id' } } }]));
      yield* this.utils.getSpaceInfo();

      expect(this.storeGet.calledOnce).toBe(true);
    });

    it('returns spaceId from the store', function* () {
      this.storeGet.returns('some_id');
      this.getFatSpaces.returns(Promise.resolve([{ data: { sys: { id: 'some_id' } } }]));
      const { spaceId } = yield* this.utils.getSpaceInfo();

      expect(spaceId).toBe('some_id');
    });

    it('returns a new spaceId if we have invalid in the store', function* () {
      this.storeGet.returns('some_id');
      this.getFatSpaces.returns(Promise.resolve([{ data: { sys: { id: 'new_id' } } }]));

      const { spaceId } = yield* this.utils.getSpaceInfo();
      expect(spaceId).toBe('new_id');
    });

    it('throws an error if there are no spaces', function* () {
      this.getFatSpaces.returns(Promise.resolve([]));
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
      this.getOrganizations.returns(Promise.resolve([{ sys: { id: 'some_org_id' } }]));
      const { orgId } = yield* this.utils.getOrg();

      expect(orgId).toBe('some_org_id');
    });

    it('returns org from the selected space', function* () {
      this.storeGet.returns('some_org_id');
      this.getOrganizations.returns(Promise.resolve([]));
      this.getFatSpaces.returns(Promise.resolve([
        {
          getOrganizationId: () => 'some_new_org_id',
          data: { sys: { id: 'some_space_id' } }
        }
      ]));
      const { orgId } = yield* this.utils.getOrg();

      expect(orgId).toBe('some_new_org_id');
    });
  });
});
