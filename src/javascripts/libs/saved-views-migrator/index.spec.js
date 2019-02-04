const { cloneDeep } = require('lodash');
const savedViewsMigrator = require('./index');
const _ = require('lodash');
const { textQueryToUISearch } = require('./text-query-converter');

let step = 0;
jest.mock('./text-query-converter', () => ({
  textQueryToUISearch: jest.fn()
}));

describe('savedViewMigrator', () => {
  let migrateView,
    migrateViewsFolder,
    migrateUIConfigViews,
    viewMigrator,
    contentTypes = {};

  beforeEach(async function() {
    textQueryToUISearch.mockClear();

    contentTypes = {};

    viewMigrator = savedViewsMigrator.create(contentTypes, () =>
      Promise.resolve([
        { sys: { id: 'UID1' }, firstName: 'John', lastName: 'Doe' },
        { sys: { id: 'UID2' }, firstName: 'Jon', lastName: 'Doe' },
        { sys: { id: 'UID3' }, firstName: 'Jon', lastName: 'Doe' }
      ])
    );
    migrateView = viewMigrator.migrateView.bind(viewMigrator);
    migrateViewsFolder = viewMigrator.migrateViewsFolder.bind(viewMigrator);
    migrateUIConfigViews = viewMigrator.migrateUIConfigViews.bind(viewMigrator);
  });

  describe('#migrateView()', () => {
    describe('on View without a `searchTerm` (no migration required)', () => {
      const VIEW = {
        contentTypeId: 'SOME_ID'
      };

      it('resolves with given view', function*() {
        const migratedView = yield migrateView(VIEW);
        expect(migratedView).toBe(VIEW);
      });

      it('does not call `TextQueryConverter.textQueryToUISearch()`', function*() {
        yield migrateView(VIEW);
        expect(textQueryToUISearch).not.toHaveBeenCalled();
      });
    });

    describe('on View requiring migration', () => {
      const SEARCH_TERM = uniqueObject();
      const BASE_VIEW = {
        id: 'SOME_VIEW_ID',
        searchTerm: SEARCH_TERM,
        propertyUnrelatedToSearch: uniqueObject()
      };
      const CONVERTED_SEARCH_TERM = {
        searchText: uniqueObject(),
        searchFilters: uniqueObject()
      };

      describe('on view with a `searchTerm`', () => {
        beforeEach(function() {
          // `null` instead of {ContentType} as no `contentTypeId` is set in VIEW.
          textQueryToUISearch.mockImplementationOnce((...args) => {
            if (args[0] === null && args[1] === SEARCH_TERM) {
              return Promise.resolve(CONVERTED_SEARCH_TERM);
            }
          });
        });

        testMigrateViewSuccess(BASE_VIEW, CONVERTED_SEARCH_TERM);
      });

      describe('on view with a `searchTerm` and `contentTypeId`', () => {
        const VIEW_WITH_CT = Object.assign({}, BASE_VIEW, {
          contentTypeId: 'TEST_CT_ID'
        });
        const CONTENT_TYPE = uniqueObject();

        beforeEach(function() {
          contentTypes['TEST_CT_ID'] = CONTENT_TYPE;

          textQueryToUISearch.mockImplementationOnce((...args) => {
            if (args[0] === CONTENT_TYPE && args[1] === SEARCH_TERM) {
              return Promise.resolve(CONVERTED_SEARCH_TERM);
            }
          });
        });

        testMigrateViewSuccess(VIEW_WITH_CT, CONVERTED_SEARCH_TERM);
      });

      describe('TextQueryConverter.textQueryToUISearch() error', () => {
        beforeEach(function() {
          textQueryToUISearch.mockImplementationOnce(() => {
            throw 'SOME UNKNOWN MIGRATION ERROR';
          });
        });

        testMigrateViewOnError(BASE_VIEW);
      });

      describe('TextQueryConverter.textQueryToUISearch() rejects', () => {
        beforeEach(function() {
          // convertStub.rejects('SOME UNKNOWN MIGRATION ERROR')
          textQueryToUISearch.mockRejectedValueOnce('SOME UNKNOWN MIGRATION ERROR');
        });

        testMigrateViewOnError(BASE_VIEW);
      });
    });

    function testMigrateViewSuccess(view, convertedSearchTerm) {
      testMigrateViewBasics(view);

      it('has a `searchText` as provided by `TextQueryConverter`', function*() {
        const result = yield migrateView(view);
        const { searchText } = result;

        expect(searchText).toEqual(convertedSearchTerm.searchText);
      });

      it('has `searchFilters` as provided by `TextQueryConverter`', function*() {
        const { searchFilters } = yield migrateView(view);
        expect(searchFilters).toEqual(convertedSearchTerm.searchFilters);
      });
    }

    function testMigrateViewOnError(view) {
      testMigrateViewBasics(view);

      it('returns view with empty search', function*() {
        const { searchText, searchFilters } = yield migrateView(view);
        const emptySearch = {
          searchText: '',
          searchFilters: []
        };
        expect({ searchText, searchFilters }).toEqual(emptySearch);
      });

      it('adds a `_legacySearchTerm` field', function*() {
        const { _legacySearchTerm: legacySearchTerm } = yield migrateView(view);
        expect(legacySearchTerm).toEqual(view.searchTerm);
      });
    }

    function testMigrateViewBasics(view) {
      it('does not mutate given view', function*() {
        const viewClone = cloneDeep(view);
        yield migrateView(viewClone);
        expect(viewClone).toEqual(view);
      });

      it('calls `TextQueryConverter.textQueryToUISearch()`', function*() {
        yield migrateView(view);
        expect(textQueryToUISearch).toHaveBeenCalledTimes(1);
      });

      it('deletes the `searchTerm', function*() {
        const { searchTerm } = yield migrateView(view);
        expect(searchTerm).toBeUndefined();
      });

      it('preserves search unrelated view properties', function*() {
        const { id, propertyUnrelatedToSearch } = yield migrateView(view);
        expect(id).toEqual(view.id);
        expect(propertyUnrelatedToSearch).toEqual(view.propertyUnrelatedToSearch);
      });
    }
  });

  describe('#migrateViewsFolder()', () => {
    let migrateViewStub;

    beforeEach(function() {
      migrateViewStub = jest.fn();
      viewMigrator.migrateView = migrateViewStub;
    });

    describe('with multiple views', () => {
      const VIEWS = [uniqueObject(), uniqueObject()];
      const MIGRATED_VIEWS = [uniqueObject(), uniqueObject()];
      const FOLDER = {
        name: 'Two views',
        views: VIEWS
      };
      const MIGRATED_FOLDER = {
        name: 'Two views',
        views: MIGRATED_VIEWS
      };

      beforeEach(function() {
        migrateViewStub.mockImplementation((...args) => {
          if (_.isEqual(args[0], VIEWS[0])) {
            return Promise.resolve(MIGRATED_VIEWS[0]);
          }

          if (_.isEqual(args[0], VIEWS[1])) {
            return Promise.resolve(MIGRATED_VIEWS[1]);
          }
        });
      });

      testMigrateViewsFolder(FOLDER, MIGRATED_FOLDER);
    });

    describe('without any views', () => {
      const FOLDER = {
        name: 'No views',
        views: []
      };

      testMigrateViewsFolder(FOLDER, FOLDER);
    });

    function testMigrateViewsFolder(folder, expectedMigratedFolder) {
      it('does not mutate given folder', function*() {
        const folderClone = cloneDeep(folder);
        yield migrateViewsFolder(folderClone);
        expect(folderClone).toEqual(folder);
      });

      it('calls `migrateView()` once for each view', function*() {
        yield migrateViewsFolder(folder);
        expect(migrateViewStub).toHaveBeenCalledTimes(folder.views.length);
      });

      it('migrates views', function*() {
        const migratedFolder = yield migrateViewsFolder(folder);
        expect(migratedFolder).toEqual(expectedMigratedFolder);
      });
    }
  });

  describe('#migrateUIConfigViews()', () => {
    let migrateViewsFolderStub;

    beforeEach(function() {
      migrateViewsFolderStub = jest.fn();
      viewMigrator.migrateViewsFolder = migrateViewsFolderStub;
    });

    describe('without `entryListViews` or `assetListViews`', () => {
      testDoesNotMigrate({ sys: { id: 'SOME_ID' } });
    });

    describe('without `assetListViews` and empty `entryListViews`', () => {
      testDoesNotMigrate({ entryListViews: [] });
    });

    describe('without `entryListViews` and empty `assetListViews`', () => {
      testDoesNotMigrate({ someThingElse: 'foo', assetListViews: [] });
    });

    describe('with empty `entryListViews` and empty `assetListViews`', () => {
      testDoesNotMigrate({ foo: 'bar', entryListViews: [], assetListViews: [] });
    });

    function testDoesNotMigrate(uiConfig) {
      it('does no migration, returns equal UIConfig', function*() {
        const migratedUIConfig = yield migrateUIConfigViews(uiConfig);
        expect(migratedUIConfig).toEqual(uiConfig);
      });

      it('does not call `migrateViewsFolder()`', function*() {
        yield migrateUIConfigViews(uiConfig);
        expect(migrateViewsFolderStub).not.toHaveBeenCalled();
      });
    }

    describeWithMultipleFoldersIn('assetListViews');

    function describeWithMultipleFoldersIn(field) {
      describe(
        `with multiple folders in \`${field}\``,
        testWithMultipleFoldersIn.bind(null, field)
      );
    }

    function testWithMultipleFoldersIn(field) {
      const FOLDERS = [uniqueObject(), uniqueObject(), uniqueObject()];
      const MIGRATED_FOLDERS = [uniqueObject(), uniqueObject(), uniqueObject()];
      const UI_CONFIG = { someThingElse: 'foo' };
      UI_CONFIG[field] = FOLDERS;
      const MIGRATED_UI_CONFIG = { someThingElse: 'foo' };
      MIGRATED_UI_CONFIG[field] = MIGRATED_FOLDERS;

      beforeEach(function() {
        migrateViewsFolderStub.mockImplementation((...args) => {
          if (_.isEqual(args[0], FOLDERS[0])) {
            return Promise.resolve(MIGRATED_FOLDERS[0]);
          }

          if (_.isEqual(args[0], FOLDERS[1])) {
            return Promise.resolve(MIGRATED_FOLDERS[1]);
          }

          if (_.isEqual(args[0], FOLDERS[2])) {
            return Promise.resolve(MIGRATED_FOLDERS[2]);
          }
        });
      });

      it('does not mutate given uiConfig', function*() {
        const uiConfigClone = cloneDeep(UI_CONFIG);
        yield migrateUIConfigViews(uiConfigClone);
        expect(uiConfigClone).toEqual(UI_CONFIG);
      });

      it('calls `migrateViewsFolder()` once for each folder', function*() {
        yield migrateUIConfigViews(UI_CONFIG);
        expect(migrateViewsFolderStub).toHaveBeenCalledTimes(FOLDERS.length);
      });

      it('migrates views', function*() {
        const migratedUIConfig = yield migrateUIConfigViews(UI_CONFIG);
        expect(migratedUIConfig).toEqual(MIGRATED_UI_CONFIG);
      });
    }
  });

  // TODO: Move to test helpers and also replace in `logger_spec.js`.
  function uniqueObject(properties) {
    const o = {};
    o[`UNIQUE_TEST_PROPERTY_${++step}`] = `UNIQUE TEST PROPERTY ${step} VALUE`;
    return Object.assign(o, properties);
  }
});
