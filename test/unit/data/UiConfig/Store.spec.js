import { cloneDeep } from 'lodash';

import * as sinon from 'helpers/sinon';
import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';

describe('data/UiConfig/Store.es6', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      this.trackMigrationSpy = sinon.spy();
      $provide.value('analytics/events/SearchAndViews.es6', {
        searchTermsMigrated: this.trackMigrationSpy
      });
    });

    const createUiConfigStore = this.$inject('data/UiConfig/Store.es6').default;
    const endpoint = createMockSpaceEndpoint();

    this.store = endpoint.stores.ui_config;

    this.migrateStub = sinon.stub();

    this.create = (isAdmin = true) => {
      const ctRepo = { getAllBare: () => [{ sys: { id: 1 }, name: 'bar' }] };
      const viewMigrator = {
        migrateUIConfigViews: this.migrateStub
      };
      const spaceData = {
        sys: { id: 'spaceid' },
        spaceMembership: {
          admin: isAdmin,
          user: {
            firstName: 'x',
            lastName: 'y',
            sys: { id: 'userid' }
          }
        }
      };
      return createUiConfigStore({ data: spaceData }, endpoint.request, ctRepo, viewMigrator);
    };
  });

  describe('#entries.shared', () => {
    it('#get() gets loaded config', async function() {
      this.store.default = { _migrated: { entryListViews: 'DATA' } };
      const api = await this.create();
      expect(api.entries.shared.get()).toEqual('DATA');
    });

    it('#get() returns default values if not set', async function() {
      this.store.default = { _migrated: { entryListViews: undefined } };
      const api = await this.create();
      expect(api.entries.shared.get().length).toEqual(3);
    });

    it('#set() creates, updates and deletes UiConfig', async function() {
      expect(this.store.default).toBe(undefined);
      const api = await this.create();

      await api.entries.shared.set('DATA1');
      expect(this.store.default._migrated.entryListViews).toEqual('DATA1');

      await api.entries.shared.set('DATA2');
      expect(this.store.default._migrated.entryListViews).toEqual('DATA2');

      await api.entries.shared.set(undefined);
      expect(this.store.default._migrated.entryListViews).toEqual(undefined);
    });
  });

  describe('#addOrEditCt()', () => {
    beforeEach(function() {
      this.mockCt = { sys: { id: 1 }, name: 'bar' };

      this.withCts = {
        sys: { id: 'default', version: 1 },
        _migrated: {
          entryListViews: [
            {
              title: 'Content Type',
              views: [
                {
                  title: 'foo',
                  contentTypeId: 2
                }
              ]
            }
          ]
        }
      };
    });

    it('does nothing if config is not defined', async function() {
      const api = await this.create();
      await api.addOrEditCt({ name: 'new' });
      expect(this.store.default).toBe(undefined);
    });

    it('does nothing if there is no "Content Type" folder', async function() {
      const config = { _migrated: { entryListViews: [{ title: 'foo' }] } };
      this.store.default = cloneDeep(config);
      const api = await this.create();
      await api.addOrEditCt(this.mockCt);
      expect(this.store.default).toEqual(config);
    });

    it('does nothing if a user is not an admin', async function() {
      this.store.default = cloneDeep(this.withCts);
      const api = await this.create(false);
      await api.addOrEditCt(this.mockCt);
      expect(this.store.default).toEqual(this.withCts);
    });

    it('adds content type if it doesn’t exist', async function() {
      this.store.default = cloneDeep(this.withCts);

      const api = await this.create();
      await api.addOrEditCt(this.mockCt);

      sinon.assert.match(
        this.store.default._migrated.entryListViews,
        sinon.match([
          {
            title: 'Content Type',
            views: [
              {
                title: 'foo',
                contentTypeId: 2
              },
              sinon.match({
                title: 'bar',
                contentTypeId: 1
              })
            ]
          }
        ])
      );
    });

    it('edits view title when existing Content Type is changed', async function() {
      this.store.default = cloneDeep(this.withCts);
      this.mockCt.sys.id = 2;

      const api = await this.create();
      await api.addOrEditCt(this.mockCt);

      sinon.assert.match(
        this.store.default._migrated.entryListViews,
        sinon.match([
          {
            title: 'Content Type',
            views: [
              sinon.match({
                title: 'bar',
                contentTypeId: 2
              })
            ]
          }
        ])
      );
    });
  });

  describe('unmigrated data', () => {
    const INITIAL_DATA = {
      sys: { version: 1 },
      entryListViews: 'DATA'
    };
    const MIGRATED_DATA = {
      sys: { version: 1 },
      entryListViews: 'MIGRATED DATA'
    };

    beforeEach(function() {
      this.store.default = cloneDeep(INITIAL_DATA);
      this.migrateStub.resolves(MIGRATED_DATA);
    });

    // NOTE: We originally designed the migration to be stored back immediately
    // but ultimately decided against it (for now) to avoid "mass migration".
    it('does not immediately save migrated version back to store', async function() {
      await this.create(true);
      expect(this.store.default).toEqual(INITIAL_DATA);
    });

    it('does not save migration back to store if non-admin user', async function() {
      await this.create(false);
      expect(this.store.default).toEqual(INITIAL_DATA);
    });

    describe('migration', function() {
      it('results in `_migrated` property in payload', function*() {
        const api = yield this.create();
        yield api.entries.shared.set('UPDATED ENTRY LIST VIEWS');
        expect(this.store.default).toEqual({
          sys: { version: 2 },
          _migrated: {
            entryListViews: 'UPDATED ENTRY LIST VIEWS'
          }
        });
      });

      it('is being tracked', async function() {
        const api = await this.create();
        await api.entries.shared.set(MIGRATED_DATA.entryListViews);
        sinon.assert.calledOnceWith(this.trackMigrationSpy, MIGRATED_DATA, 'ui_config');
      });

      it('is not tracked after migration', async function() {
        const api = await this.create();
        await api.entries.shared.set('DATA 1');
        this.trackMigrationSpy.reset();
        await api.entries.shared.set('DATA 2');
        sinon.assert.notCalled(this.trackMigrationSpy);
      });
    });
  });

  describe('empty data (ui_config/me does not 404)', function() {
    const EMPTY_DATA = {
      sys: { version: 1 }
    };

    beforeEach(function() {
      this.store.default = cloneDeep(EMPTY_DATA);
      this.migrateStub.resolves(EMPTY_DATA);
    });

    it('updating store does not track a migration', async function() {
      const api = await this.create();
      await api.entries.shared.set('UPDATED ENTRY LIST VIEWS');
      sinon.assert.notCalled(this.trackMigrationSpy);
    });
  });
});
