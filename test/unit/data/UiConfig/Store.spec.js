import { cloneDeep } from 'lodash';

import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';
import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';


describe('data/UiConfig/Store', function () {
  beforeEach(function () {
    module('contentful/test');
    const createUiConfigStore = this.$inject('data/UiConfig/Store').default;
    const endpoint = createMockSpaceEndpoint();
    const contentTypes$ = K.createMockProperty([{sys: {id: 1}, name: 'bar'}]);

    this.store = endpoint.stores.ui_config;

    this.migrateStub = sinon.stub();

    this.create = (isAdmin = true) => {
      const ctRepo = { items$: contentTypes$ };
      const viewMigrator = {
        migrateUIConfigViews: this.migrateStub
      };
      const spaceData = {
        sys: {id: 'spaceid'},
        spaceMembership: {
          admin: isAdmin,
          user: {
            firstName: 'x', lastName: 'y', sys: {id: 'userid'}
          }
        }
      };
      return createUiConfigStore({data: spaceData}, endpoint.request, ctRepo, viewMigrator);
    };
  });

  describe('#entries.shared', function () {
    it('#get() gets loaded config', function* () {
      this.store.default = {_migrated: {entryListViews: 'DATA'}};
      const api = yield this.create();
      expect(api.entries.shared.get()).toEqual('DATA');
    });

    it('#get() returns default values if not set', function* () {
      this.store.default = {_migrated: {entryListViews: undefined}};
      const api = yield this.create();
      expect(api.entries.shared.get().length).toEqual(3);
    });

    it('#set() creates, updates and deletes UiConfig', function* () {
      expect(this.store.default).toBe(undefined);
      const api = yield this.create();

      yield api.entries.shared.set('DATA1');
      expect(this.store.default._migrated.entryListViews).toEqual('DATA1');

      yield api.entries.shared.set('DATA2');
      expect(this.store.default._migrated.entryListViews).toEqual('DATA2');

      yield api.entries.shared.set(undefined);
      expect(this.store.default._migrated.entryListViews).toEqual(undefined);
    });
  });

  describe('#addOrEditCt()', function () {
    beforeEach(function () {
      this.mockCt = {sys: {id: 1}, name: 'bar'};

      this.withCts = {
        sys: { id: 'default', version: 1 },
        _migrated: {
          entryListViews: [{
            title: 'Content Type',
            views: [{
              title: 'foo',
              contentTypeId: 2
            }]
          }]
        }
      };
    });

    it('does nothing if config is not defined', function* () {
      const api = yield this.create();
      yield api.addOrEditCt({name: 'new'});
      expect(this.store.default).toBe(undefined);
    });

    it('does nothing if there is no "Content Type" folder', function* () {
      const config = {_migrated: {entryListViews: [{title: 'foo'}]}};
      this.store.default = cloneDeep(config);
      const api = yield this.create();
      yield api.addOrEditCt(this.mockCt);
      expect(this.store.default).toEqual(config);
    });

    it('does nothing if a user is not an admin', function* () {
      this.store.default = cloneDeep(this.withCts);
      const api = yield this.create(false);
      yield api.addOrEditCt(this.mockCt);
      expect(this.store.default).toEqual(this.withCts);
    });

    it('adds content type if it doesn’t exist', function* () {
      this.store.default = cloneDeep(this.withCts);

      const api = yield this.create();
      yield api.addOrEditCt(this.mockCt);

      sinon.assert.match(this.store.default._migrated.entryListViews, sinon.match([{
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
      this.store.default = cloneDeep(this.withCts);
      this.mockCt.sys.id = 2;

      const api = yield this.create();
      yield api.addOrEditCt(this.mockCt);

      sinon.assert.match(this.store.default._migrated.entryListViews, sinon.match([{
        title: 'Content Type',
        views: [sinon.match({
          title: 'bar',
          contentTypeId: 2
        })]
      }]));
    });
  });

  describe('unmigrated data', function () {
    const INITIAL_DATA = {
      sys: { version: 1 },
      entryListViews: 'DATA'
    };
    const MIGRATED_DATA = {
      sys: { version: 1 },
      entryListViews: 'MIGRATED DATA'
    };

    beforeEach(function () {
      this.store.default = INITIAL_DATA;
      this.migrateStub.resolves(MIGRATED_DATA);
    });

    // NOTE: We originally designed the migration to be stored back immediately
    // but ultimately decided against it (for now) to avoid "mass migration".
    it('does not immediately save migrated version back to store', function* () {
      yield this.create(true);
      expect(this.store.default).toEqual(INITIAL_DATA);
    });

    it('does not save migration back to store if non-admin user', function* () {
      yield this.create(false);
      expect(this.store.default).toEqual(INITIAL_DATA);
    });
  });
});
