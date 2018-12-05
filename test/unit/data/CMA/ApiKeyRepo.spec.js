import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';
import _ from 'lodash';

describe('data/CMA/ApiKeyRepo.es6', () => {
  beforeEach(function() {
    module('contentful/test');
    const endpoint = createMockSpaceEndpoint();
    this.deliveryStore = endpoint.stores.api_keys;
    this.previewStore = endpoint.stores.preview_api_keys;
    this.endpoint = sinon.spy(endpoint.request);
    this.repo = this.$inject('data/CMA/ApiKeyRepo.es6').default(this.endpoint);

    this.deliveryStore.ID = {
      sys: { id: 'ID' },
      accessToken: 'DELIVERY_TOKEN',
      preview_api_key: makeLink('PREVIEW_ID')
    };
    this.previewStore.PREVIEW_ID = {
      sys: { id: 'PREVIEW_ID' },
      accessToken: 'PREVIEW_TOKEN'
    };
  });

  describe('#get()', () => {
    it('gets key with preview token for id', function*() {
      const key = yield this.repo.get('ID');
      expect(key.accessToken).toBe('DELIVERY_TOKEN');
      expect(key.preview_api_key.accessToken).toBe('PREVIEW_TOKEN');
    });
  });

  describe('#save()', () => {
    it('it saves key and returns updated key', function*() {
      const key = yield this.repo.get('ID');
      key.name = 'NEW NAME';
      const savedKey = yield this.repo.save(key);
      expect(savedKey.name).toBe('NEW NAME');

      const key2 = yield this.repo.get('ID');
      expect(key2.name).toBe('NEW NAME');
    });

    it('refreshes key list', function*() {
      const keysBefore = yield this.repo.getAll();
      expect(keysBefore[0].name).not.toBe('NEW NAME');

      const key = _.cloneDeep(keysBefore[0]);
      key.name = 'NEW NAME';
      yield this.repo.save(key);

      const keysAfter = yield this.repo.getAll();
      expect(keysAfter[0].name).toBe('NEW NAME');
    });
  });

  describe('#getAll()', () => {
    beforeEach(function() {
      this.deliveryStore.ID2 = { sys: { id: 'ID2' } };
    });

    it('gets all keys', function*() {
      const keys = yield this.repo.getAll();
      expect(keys.map(k => k.sys.id)).toEqual(['ID', 'ID2']);
    });

    it('caches response until refresh()', function*() {
      yield this.repo.getAll();
      this.deliveryStore.ID2.name = 'NEW NAME';
      const keys = yield this.repo.getAll();
      sinon.assert.calledOnce(this.endpoint);
      expect(keys[1].name).toBe(undefined);

      const keysRefreshed1 = yield this.repo.refresh();
      expect(keysRefreshed1[1].name).toBe('NEW NAME');

      const keysRefreshed2 = yield this.repo.getAll();
      expect(keysRefreshed2[1].name).toBe('NEW NAME');
    });
  });

  describe('#remove()', () => {
    it('removes key', function*() {
      const keysBefore = yield this.repo.getAll();
      expect(keysBefore.length).toBe(1);
      yield this.repo.remove('ID');
      const keysAfter = yield this.repo.getAll();
      expect(keysAfter.length).toBe(0);
    });
  });

  function makeLink(id, type) {
    return {
      sys: {
        id: id,
        type: 'Link',
        linkType: type
      }
    };
  }
});
