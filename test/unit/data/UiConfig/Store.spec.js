import { cloneDeep } from 'lodash';
import * as sinon from 'helpers/sinon';
import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';

describe('data/UiConfig/Store', function () {
  let uiConfig;

  beforeEach(function () {
    module('contentful/test');
    const createUiConfigStore = this.$inject('data/UiConfig/Store').default;
    const endpoint = createMockSpaceEndpoint();
    uiConfig = createUiConfigStore(endpoint.request, true);
    this.store = endpoint.stores.ui_config;
  });

  describe('#load', function () {
    it('returns server data if available', function* () {
      const config = {
        entryListViews: [{}]
      };
      this.store.default = config;
      const val = yield uiConfig.load();
      expect(val).toEqual(config);
    });

    it('resolves to empty object if server returns 404', function* () {
      const result = yield uiConfig.load();
      expect(result).toEqual({});
    });
  });

  describe('#resetEntries', function () {
    it('returns defaults', function () {
      expect(uiConfig.resetEntries().length).toBe(3);
    });
  });

  describe('#resetAssets', function () {
    it('returns defaults', function () {
      expect(uiConfig.resetAssets().length).toBe(3);
    });
  });

  describe('#save', function () {
    it('creates UiConfig', function* () {
      yield uiConfig.load();
      yield uiConfig.save({
        data: 'DATA'
      });
      expect(this.store.default.data).toEqual('DATA');
    });

    it('updates UiConfig', function* () {
      yield uiConfig.load();
      yield uiConfig.save({
        data: 'DATA1'
      });
      yield uiConfig.save({
        data: 'DATA2'
      });
      expect(this.store.default.data).toEqual('DATA2');
    });
  });


  describe('#addOrEditCt', function () {
    let mockCt;

    beforeEach(function () {
      mockCt = {
        data: {
          name: 'bar'
        },
        getId: _.constant(1)
      };
    });

    it('does nothing if config is not defined', function* () {
      const newConfig = { name: 'new' };
      yield uiConfig.load();
      yield uiConfig.addOrEditCt(newConfig);
      expect(this.store.default).toBe(undefined);
    });

    it('does nothing if there is no `Content Type` folder', function* () {
      const config = {
        entryListViews: [{ title: 'foo' }]
      };
      this.store.default = cloneDeep(config);
      yield uiConfig.load();
      yield uiConfig.addOrEditCt(mockCt);
      expect(this.store.default).toEqual(config);
    });

    it('adds content type if it doesn’t exist', function* () {
      this.store.default = {
        sys: { id: 'default', version: 1 },
        entryListViews: [{
          title: 'Content Type',
          views: [{
            title: 'foo',
            contentTypeId: 2
          }]
        }]
      };

      yield uiConfig.load();
      yield uiConfig.addOrEditCt(mockCt);
      sinon.assert.match(this.store.default.entryListViews, sinon.match([{
        title: 'Content Type',
        views: [{
          title: 'foo',
          contentTypeId: 2
        }, sinon.match({
          title: 'bar',
          contentTypeId: 1
        })]
      }]));
    });

    it('edits view title when existing Content Type is changed', function* () {
      this.store.default = {
        sys: { id: 'default', version: 1 },
        entryListViews: [{
          title: 'Content Type',
          views: [{
            title: 'foo',
            contentTypeId: 2
          }]
        }]
      };
      mockCt.getId = _.constant(2);

      yield uiConfig.load();
      yield uiConfig.addOrEditCt(mockCt);
      sinon.assert.match(this.store.default.entryListViews, sinon.match([{
        title: 'Content Type',
        views: [sinon.match({
          title: 'bar',
          contentTypeId: 2
        })]
      }]));
    });
  });
});
