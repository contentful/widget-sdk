'use strict';

describe('Asset List Controller', function () {
  let scope, spaceContext, stubs, $q, getAssets;

  afterEach(function () {
    scope = spaceContext = stubs = $q = getAssets = null;
  });

  function createAssets (n) {
    const assets = _.map(new Array(n), function () {
      return { isDeleted: _.constant(false), data: { fields: [] } };
    });
    Object.defineProperty(assets, 'total', {value: n});
    return assets;
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'archived',
        'track',
        'getAssets',
        'then',
        'logError',
        'pickMultiple',
        'parseFPFile',
        'warn',
        'info',
        'serverError',
        'process',
        'getVersion',
        'publish'
      ]);

      $provide.value('logger', {
        logError: stubs.logError
      });

      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn,
        serverError: stubs.serverError
      });

      $provide.value('filepicker', {
        pickMultiple: stubs.pickMultiple,
        parseFPFile: stubs.parseFPFile
      });

      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    $q = this.$inject('$q');

    scope = this.$inject('$rootScope').$new();
    scope.context = {};

    const cfStub = this.$inject('cfStub');
    const space = cfStub.space('test');

    getAssets = $q.defer();
    stubs.getAssets.returns(getAssets.promise);
    space.getAssets = stubs.getAssets;

    spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.space = space;
    spaceContext.publishedCTs = {getAllBare: () => []};

    const $controller = this.$inject('$controller');
    $controller('AssetListController', {$scope: scope});
    scope.selection.updateList = sinon.stub();
  });


  describe('on search change', function () {
    beforeEach(function () {
      scope.context.view = {};
      scope.$digest();
    });

    describe('if search is not defined', function () {
      it('list is not defined', function () {
        expect(scope.context.list).toBeUndefined();
      });
    });

    describe('if search is set', function () {
      beforeEach(function () {
        scope.context.view.searchText = 'thing';
        scope.context.view.searchFilters = [];
        scope.$digest();
      });

      it('page is set to the first one', function () {
        expect(scope.searchController.paginator.getPage()).toBe(0);
      });
    });
  });


  describe('page parameters change trigger assets reset', function () {
    beforeEach(function () {
      stubs.reset = sinon.stub(scope.searchController, 'resetAssets');
    });

    afterEach(function () {
      stubs.reset.restore();
    });

    it('search', function () {
      scope.context.view = {};
      scope.searchController.paginator.setPage(0);
      scope.$digest();
      stubs.reset.restore();
      stubs.reset = sinon.stub(scope.searchController, 'resetAssets');
      scope.context.view.searchText = 'thing';
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
    });

    it('page', function () {
      scope.searchController.paginator.setPage(1);
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('list', function () {
      scope.context.list = 'all';
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('space id', function () {
      stubs.id = sinon.stub(spaceContext.space, 'getId');
      stubs.id.returns(123);
      scope.$digest();
      sinon.assert.called(stubs.reset);
      stubs.id.restore();
    });
  });

  describe('resetting assets', function () {
    let assets;
    beforeEach(function () {
      assets = createAssets(30);
      getAssets.resolve(assets);
    });

    it('unsets isSearching flag if successful', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.context.isSearching).toBe(false);
    });

    it('loads assets', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(stubs.getAssets);
    });

    it('sets assets num on the paginator', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.searchController.paginator.getTotal()).toEqual(30);
    });

    it('sets assets on scope', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.assets).toEqual(assets);
    });

    it('filters out deleted assets', function () {
      assets[0].isDeleted = _.constant(true);
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.assets.length).toBe(29);
      expect(scope.assets.indexOf(assets[0])).toBe(-1);
    });

    it('updates selected items with retrieved list', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(scope.selection.updateList.withArgs(assets));
    });

    describe('creates a query object', function () {
      it('with a defined order', function () {
        scope.context.list = 'all';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function () {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].limit).toEqual(40);
      });

      it('with a defined skip param', function () {
        const SKIP = 1337;
        scope.searchController.paginator.getSkipParam = sinon.stub().returns(SKIP);
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].skip).toBe(SKIP);
      });
    });
  });

  describe('Api Errors', function () {
    beforeEach(function () {
      this.handler = this.$inject('ReloadNotification').apiErrorHandler;
      stubs.getAssets.returns($q.reject({statusCode: 500}));
    });

    it('should cause resetAssets to show an error message', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(this.handler);
    });

    it('should cause loadMore to show an error message', function () {
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(this.handler);
    });
  });

  describe('loadMore', function () {
    let assets;
    beforeEach(function () {
      assets = createAssets(30);

      scope.assets = createAssets(60);

      // loadMore triggers resetEntries which in reality will not
      // run because the promisedLoader prevents that. In this test
      // the PromisedLoader is stubbed, so we need to fake
      // resetEntries not running:
      scope.searchController.resetAssets = sinon.stub();

      scope.searchController.paginator.isAtLast = sinon.stub().returns(false);
    });

    it('doesnt load if on last page', function () {
      scope.searchController.paginator.isAtLast.returns(true);
      scope.searchController.loadMore();
      sinon.assert.notCalled(stubs.getAssets);
    });

    it('paginator count is increased', function () {
      scope.searchController.paginator.setPage(0);
      scope.searchController.loadMore();
      expect(scope.searchController.paginator.getPage()).toBe(1);
    });

    it('gets query params', function () {
      scope.searchController.loadMore();
      scope.$apply();
      expect(stubs.getAssets.args[0][0]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.searchController.paginator.setTotal(47);
      scope.searchController.paginator.setPage(0);
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(stubs.getAssets);
    });

    describe('on successful load response', function () {
      beforeEach(function () {
        getAssets.resolve(assets);
        scope.$apply();
        scope.searchController.paginator.setPage(1);
        scope.searchController.loadMore();
      });

      it('sets num assets', function () {
        scope.$apply();
        expect(scope.searchController.paginator.getTotal()).toEqual(30);
      });

      it('appends assets to scope', function () {
        scope.$apply();
        scope.assets.slice(60).forEach(function (asset, i) {
          expect(assets[i]).toBe(asset);
        });
      });
    });

    describe('on failed load response', function () {
      beforeEach(function () {
        getAssets.resolve(assets);
        scope.searchController.paginator.setPage(1);
        scope.$apply(); // trigger resetAssets
        stubs.getAssets.returns($q.resolve());
        sinon.spy(scope.assets, 'push');
        scope.searchController.loadMore();
        scope.$apply(); // trigger loadMore promises
      });

      it('appends assets to scope', function () {
        sinon.assert.notCalled(scope.assets.push);
      });

      it('sends an error', function () {
        sinon.assert.called(stubs.logError);
      });
    });

    describe('on previous page', function () {
      beforeEach(function () {
        scope.$apply(); // trigger resetAssets
        getAssets.reject();
        scope.$apply();
        scope.searchController.paginator.setPage(1);
        sinon.spy(scope.assets, 'push');
        scope.searchController.loadMore();
        scope.$apply();
      });

      it('appends assets to scope', function () {
        sinon.assert.notCalled(scope.assets.push);
      });

      it('pagination count decreases', function () {
        expect(scope.searchController.paginator.getPage()).toBe(1);
      });
    });
  });

  describe('creating multiple assets', function () {
    let files, entity;
    beforeEach(function () {
      files = [{}, {}];
      scope.searchController.resetAssets = sinon.stub().resolves();
      spaceContext.space.createAsset = sinon.stub();
      stubs.pickMultiple.returns($q.resolve(files));
      stubs.getVersion.returns(2);
      stubs.parseFPFile.returns({fileName: 'file_name.jpg'});
      entity = {process: stubs.process, getVersion: stubs.getVersion, publish: stubs.publish};


      spaceContext.space.createAsset
        .onCall(0).returns($q.resolve(entity))
        .onCall(1).returns($q.resolve(entity));
      stubs.publish
        .onCall(0).returns($q.resolve())
        .onCall(1).returns($q.resolve());
      stubs.process
        .onCall(0).returns($q.resolve())
        .onCall(1).returns($q.resolve())
        .onCall(2).returns($q.resolve())
        .onCall(3).returns($q.resolve());

      scope.createMultipleAssets();
      this.$apply();
    });

    it('filepicker is called', function () {
      sinon.assert.calledOnce(stubs.pickMultiple);
    });

    it('asset is created', function () {
      sinon.assert.calledTwice(spaceContext.space.createAsset);
    });

    it('process is triggered', function () {
      sinon.assert.calledTwice(stubs.process);
    });
  });

  describe('#showNoAssetsAdvice', function () {
    beforeEach(function () {
      scope.context.view = {};
      this.assertShowNoAssetsAdvice = function ({total, term, searching, expected}) {
        scope.searchController.paginator.setTotal(total);
        scope.context.view.searchText = term;
        scope.context.isSearching = searching;
        expect(scope.showNoAssetsAdvice()).toBe(expected);
      };
    });

    it('is true when there are no entries, no search term and not searching', function () {
      this.assertShowNoAssetsAdvice({total: 0, term: null, searching: false, expected: true});
    });

    it('is false when there are entries', function () {
      this.assertShowNoAssetsAdvice({total: 1, term: '', searching: false, expected: false});
    });

    it('is false when there is a search term', function () {
      this.assertShowNoAssetsAdvice({total: 0, term: 'foo', searching: false, expected: false});
    });

    it('is false when the view is loading', function () {
      this.assertShowNoAssetsAdvice({total: 0, term: '', searching: true, expected: false});
    });
  });
});
