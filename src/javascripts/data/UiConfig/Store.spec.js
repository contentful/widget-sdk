import { cloneDeep } from 'lodash';

import createMockSpaceEndpoint from '__mocks__/createSpaceEndpointMock';
import * as SearchAndViews from 'analytics/events/SearchAndViews';

import createUiConfigStore from 'data/UiConfig/Store';

jest.mock('analytics/events/SearchAndViews');

describe('data/UiConfig/Store', () => {
  let trackMigrationSpy, store, migrateStub, create, mockCt, withCts;
  beforeEach(async function () {
    trackMigrationSpy = jest.fn();

    SearchAndViews.searchTermsMigrated = trackMigrationSpy;

    const endpoint = createMockSpaceEndpoint();

    store = endpoint.stores.ui_config;

    migrateStub = jest.fn();

    create = (isAdmin = true) => {
      const ctRepo = { getAllBare: () => [{ sys: { id: 1 }, name: 'bar' }] };
      const viewMigrator = {
        migrateUIConfigViews: migrateStub,
      };
      const spaceData = {
        sys: { id: 'spaceid' },
        spaceMember: {
          admin: isAdmin,
          sys: {
            user: {
              firstName: 'x',
              lastName: 'y',
              sys: { id: 'userid' },
            },
          },
        },
      };
      return createUiConfigStore({ data: spaceData }, endpoint.request, ctRepo, viewMigrator);
    };
  });

  describe('#entries.shared', () => {
    it('#get() returns and saves default values if not set', async function () {
      const api = await create();
      expect(await api.entries.shared.get()).toHaveLength(3);
    });

    it('#get() gets loaded config', async function () {
      store.default = { _migrated: { entryListViews: 'DATA' } };
      const api = await create();
      expect(await api.entries.shared.get()).toEqual('DATA');
    });

    it('#set() creates, updates and reinitializes UiConfig', async function () {
      const api = await create();

      await api.entries.shared.set('DATA1');
      expect(store.default._migrated.entryListViews).toEqual('DATA1');

      await api.entries.shared.set('DATA2');
      expect(store.default._migrated.entryListViews).toEqual('DATA2');

      await api.entries.shared.set(undefined);
      expect(await api.entries.shared.get()).toHaveLength(3);
    });
  });

  describe('#addOrEditCt()', () => {
    beforeEach(function () {
      mockCt = { sys: { id: 1 }, name: 'bar' };

      withCts = {
        sys: { id: 'default', version: 1 },
        _migrated: {
          entryListViews: [
            {
              title: 'Content Type',
              views: [
                {
                  title: 'foo',
                  contentTypeId: 2,
                },
              ],
            },
          ],
        },
      };
    });

    it('does nothing if config is not defined', async function () {
      const api = await create();
      await api.addOrEditCt({ name: 'new' });
      expect(store.default).toBeUndefined();
    });

    it('does nothing if there is no "Content Type" folder', async function () {
      const config = { _migrated: { entryListViews: [{ title: 'foo' }] } };
      store.default = cloneDeep(config);
      const api = await create();
      await api.addOrEditCt(mockCt);
      expect(store.default).toEqual(config);
    });

    it('does nothing if a user is not an admin', async function () {
      store.default = cloneDeep(withCts);
      const api = await create(false);
      await api.addOrEditCt(mockCt);
      expect(store.default).toEqual(withCts);
    });

    it('adds content type if it doesn’t exist', async function () {
      store.default = cloneDeep(withCts);

      const api = await create();
      await api.addOrEditCt(mockCt);

      expect(store.default._migrated.entryListViews).toEqual(
        expect.objectContaining([
          {
            title: 'Content Type',
            views: [
              {
                title: 'foo',
                contentTypeId: 2,
              },
              expect.objectContaining({
                title: 'bar',
                contentTypeId: 1,
              }),
            ],
          },
        ])
      );
    });

    it('edits view title when existing Content Type is changed', async function () {
      store.default = cloneDeep(withCts);
      mockCt.sys.id = 2;

      const api = await create();
      await api.addOrEditCt(mockCt);

      expect(store.default._migrated.entryListViews).toEqual(
        expect.objectContaining([
          {
            title: 'Content Type',
            views: [
              expect.objectContaining({
                title: 'bar',
                contentTypeId: 2,
              }),
            ],
          },
        ])
      );
    });
  });

  describe('unmigrated data', () => {
    const INITIAL_DATA = {
      sys: { version: 1 },
      entryListViews: 'DATA',
    };
    const MIGRATED_DATA = {
      sys: { version: 1 },
      entryListViews: 'MIGRATED DATA',
    };

    beforeEach(function () {
      store.default = cloneDeep(INITIAL_DATA);
      migrateStub.mockReturnValue(MIGRATED_DATA);
    });

    // NOTE: We originally designed the migration to be stored back immediately
    // but ultimately decided against it (for now) to avoid "mass migration".
    it('does not immediately save migrated version back to store', async function () {
      await create(true);
      expect(store.default).toEqual(INITIAL_DATA);
    });

    it('does not save migration back to store if non-admin user', async function () {
      await create(false);
      expect(store.default).toEqual(INITIAL_DATA);
    });

    describe('migration', function () {
      it('results in `_migrated` property in payload', async function () {
        const api = await create();
        await api.entries.shared.set('UPDATED ENTRY LIST VIEWS');
        expect(store.default).toEqual({
          sys: { version: 2 },
          _migrated: {
            entryListViews: 'UPDATED ENTRY LIST VIEWS',
          },
        });
      });
    });
  });

  describe('empty data (ui_config/me does not 404)', function () {
    const EMPTY_DATA = {
      sys: { version: 1 },
    };

    beforeEach(function () {
      store.default = cloneDeep(EMPTY_DATA);
      migrateStub.mockResolvedValue(EMPTY_DATA);
    });

    it('updating store does not track a migration', async function () {
      const api = await create();
      await api.entries.shared.set('UPDATED ENTRY LIST VIEWS');
      expect(trackMigrationSpy).not.toHaveBeenCalled();
    });
  });
});
