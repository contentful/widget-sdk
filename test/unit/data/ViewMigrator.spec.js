import sinon from 'npm:sinon';
import {cloneDeep} from 'lodash';

let step = 0;

describe('ViewMigrator', function () {
  let migrateView, migrateViewsFolder, migrateUIConfigViews;

  const SPACE = uniqueObject();

  beforeEach(function () {
    this.getCTStub = sinon.stub();
    this.convertStub = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('search/TextQueryConverter', {
        textQueryToUISearch: this.convertStub
      });
    });

    const ViewMigrator = this.$inject('data/ViewMigrator');
    const createViewMigrator = ViewMigrator.default;

    const contentTypesRepo = {
      get: this.getCTStub
    };
    this.viewMigrator = createViewMigrator(SPACE, contentTypesRepo);
    migrateView = this.viewMigrator.migrateView.bind(this.viewMigrator);
    migrateViewsFolder = this.viewMigrator.migrateViewsFolder.bind(this.viewMigrator);
    migrateUIConfigViews = this.viewMigrator.migrateUIConfigViews.bind(this.viewMigrator);
  });

  describe('#migrateView()', function () {
    describe('on View without a `searchTerm` (no migration required)', function () {
      const VIEW = {
        contentTypeId: 'SOME_ID'
      };

      it('resolves with given view', function* () {
        const migratedView = yield migrateView(VIEW);
        expect(migratedView).toBe(VIEW);
      });

      it('does not call `TextQueryConverter.textQueryToUISearch()`', function* () {
        yield migrateView(VIEW);
        sinon.assert.notCalled(this.convertStub);
      });
    });

    describe('on View requiring migration', function () {
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

      describe('on view with a `searchTerm`', function () {
        beforeEach(function () {
          // `null` instead of {ContentType} as no `contentTypeId` is set in VIEW.
          this.convertStub.withArgs(
            SPACE, null, SEARCH_TERM).resolves(CONVERTED_SEARCH_TERM);
        });

        testMigrateView(BASE_VIEW, CONVERTED_SEARCH_TERM);
      });

      describe('on view with a `searchTerm` and `contentTypeId`', function () {
        const VIEW_WITH_CT = Object.assign({}, BASE_VIEW, {
          contentTypeId: 'TEST_CT_ID'
        });
        const CONTENT_TYPE = uniqueObject();

        beforeEach(function () {
          this.getCTStub.withArgs('TEST_CT_ID').returns(CONTENT_TYPE);
          this.convertStub.withArgs(
            SPACE, CONTENT_TYPE, SEARCH_TERM).resolves(CONVERTED_SEARCH_TERM);
        });

        testMigrateView(VIEW_WITH_CT, CONVERTED_SEARCH_TERM);

        it('calls `ContentTypeRepo#get()`', function* () {
          yield migrateView(VIEW_WITH_CT);
          sinon.assert.calledOnce(this.getCTStub);
        });
      });
    });

    function testMigrateView (view, convertedSearchTerm) {
      it('does not mutate given view', function* () {
        const viewClone = cloneDeep(view);
        yield migrateView(viewClone);
        expect(viewClone).toEqual(view);
      });

      it('calls `TextQueryConverter.textQueryToUISearch()`', function* () {
        yield migrateView(view);
        sinon.assert.calledOnce(this.convertStub);
      });

      it('deletes the `searchTerm', function* () {
        const {searchTerm} = yield migrateView(view);
        expect(searchTerm).toBeUndefined();
      });

      it('has a `searchText` as provided by `TextQueryConverter`', function* () {
        const {searchText} = yield migrateView(view);
        expect(searchText).toEqual(convertedSearchTerm.searchText);
      });

      it('has `searchFilters` as provided by `TextQueryConverter`', function* () {
        const {searchFilters} = yield migrateView(view);
        expect(searchFilters).toEqual(convertedSearchTerm.searchFilters);
      });

      it('preserves search unrelated view properties', function* () {
        const {id, propertyUnrelatedToSearch} = yield migrateView(view);
        expect(id).toEqual(view.id);
        expect(propertyUnrelatedToSearch).toEqual(view.propertyUnrelatedToSearch);
      });
    }
  });

  describe('#migrateViewsFolder()', function () {
    beforeEach(function () {
      this.migrateViewStub = sinon.stub();
      this.viewMigrator.migrateView = this.migrateViewStub;
    });

    describe('with multiple views', function () {
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

      beforeEach(function () {
        this.migrateViewStub
          .withArgs(VIEWS[0]).resolves(MIGRATED_VIEWS[0])
          .withArgs(VIEWS[1]).resolves(MIGRATED_VIEWS[1]);
      });

      testMigrateViewsFolder(FOLDER, MIGRATED_FOLDER);
    });

    describe('without any views', function () {
      const FOLDER = {
        name: 'No views',
        views: []
      };

      testMigrateViewsFolder(FOLDER, FOLDER);
    });

    function testMigrateViewsFolder (folder, expectedMigratedFolder) {
      it('does not mutate given folder', function* () {
        const folderClone = cloneDeep(folder);
        yield migrateViewsFolder(folderClone);
        expect(folderClone).toEqual(folder);
      });

      it('calls `migrateView()` once for each view', function* () {
        yield migrateViewsFolder(folder);
        sinon.assert.callCount(this.migrateViewStub, folder.views.length);
      });

      it('migrates views', function* () {
        const migratedFolder = yield migrateViewsFolder(folder);
        expect(migratedFolder).toEqual(expectedMigratedFolder);
      });
    }
  });

  describe('#migrateUIConfigViews()', function () {
    beforeEach(function () {
      this.migrateViewsFolderStub = sinon.stub();
      this.viewMigrator.migrateViewsFolder = this.migrateViewsFolderStub;
    });

    describe('with multiple folders', function () {
      const FOLDERS = [
        uniqueObject(), uniqueObject(), uniqueObject()];
      const MIGRATED_FOLDERS = [
        uniqueObject(), uniqueObject(), uniqueObject()];
      const UI_CONFIG = {
        someThingElse: 'foo',
        entryListViews: FOLDERS
      };
      const MIGRATED_UI_CONFIG = {
        someThingElse: 'foo',
        entryListViews: MIGRATED_FOLDERS
      };

      beforeEach(function () {
        this.migrateViewsFolderStub
          .withArgs(FOLDERS[0]).resolves(MIGRATED_FOLDERS[0])
          .withArgs(FOLDERS[1]).resolves(MIGRATED_FOLDERS[1])
          .withArgs(FOLDERS[2]).resolves(MIGRATED_FOLDERS[2]);
      });

      it('does not mutate given uiConfig', function* () {
        const uiConfigClone = cloneDeep(UI_CONFIG);
        yield migrateUIConfigViews(uiConfigClone);
        expect(uiConfigClone).toEqual(UI_CONFIG);
      });

      it('calls `migrateViewsFolder()` once for each folder', function* () {
        yield migrateUIConfigViews(UI_CONFIG);
        sinon.assert.callCount(this.migrateViewsFolderStub, FOLDERS.length);
      });

      it('migrates views', function* () {
        const migratedUIConfig = yield migrateUIConfigViews(UI_CONFIG);
        expect(migratedUIConfig).toEqual(MIGRATED_UI_CONFIG);
      });
    });
  });

  // TODO: Move to test helpers and also replace in `logger_spec.js`.
  function uniqueObject (properties) {
    const o = {};
    o[`UNIQUE_TEST_PROPERTY_${++step}`] = `UNIQUE TEST PROPERTY ${step} VALUE`;
    return Object.assign(o, properties);
  }
});
