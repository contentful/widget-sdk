import { cloneDeep, constant } from 'lodash';
import * as I from 'libs/Immutable';

import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';
import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';


describe('data/UiConfig/Store', function () {
  let uiConfig;

  beforeEach(function () {
    module('contentful/test');
    const createUiConfigStore = this.$inject('data/UiConfig/Store').default;
    const endpoint = createMockSpaceEndpoint();

    const contentTypes$ = K.createMockProperty(I.List([{
      data: {
        name: 'bar'
      },
      getId: constant(1)
    }]));

    uiConfig = createUiConfigStore(endpoint.request, true, { wrappedItems$: contentTypes$ });
    this.store = endpoint.stores.ui_config;
  });

  describe('#forEntries()', function () {
    beforeEach(function () {
      uiConfig.load();
      this.$apply();
      this.entriesConfig = uiConfig.forEntries();
    });

    it('#get() gets loaded config', function* () {
      this.store.default = {
        entryListViews: 'DATA'
      };

      yield uiConfig.load();
      expect(this.entriesConfig.get()).toEqual('DATA');
    });

    it('#get() returns default values if not set', function* () {
      this.store.default = {
        entryListViews: undefined
      };

      yield uiConfig.load();
      expect(this.entriesConfig.get().length).toEqual(3);
    });

    it('#save() creates and updates UiConfig', function* () {
      expect(this.store.default).toBe(undefined);

      yield this.entriesConfig.save('DATA1');
      expect(this.store.default.entryListViews).toEqual('DATA1');

      yield this.entriesConfig.save('DATA2');
      expect(this.store.default.entryListViews).toEqual('DATA2');
    });

    it('#reset() deletes views', function* () {
      yield this.entriesConfig.save('DATA1');
      expect(this.store.default.entryListViews).toEqual('DATA1');

      yield this.entriesConfig.save(undefined);
      expect(this.store.default.entryListViews).toEqual(undefined);
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
      mockCt.getId = constant(2);

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
