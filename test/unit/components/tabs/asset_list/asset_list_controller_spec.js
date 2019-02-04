'use strict';

import _ from 'lodash';

describe('Asset List Controller', () => {
  let scope, spaceContext, stubs, $q, getAssets, ComponentLibrary;

  afterEach(() => {
    scope = spaceContext = stubs = $q = getAssets = ComponentLibrary = null;
  });

  function createAssets(n) {
    const assets = _.map(new Array(n), () => ({
      isDeleted: _.constant(false),
      data: { fields: [] }
    }));
    Object.defineProperty(assets, 'total', { value: n });
    return assets;
  }

  beforeEach(function() {
    module('contentful/test', $provide => {
      stubs = $provide.makeStubs([
        'archived',
        'track',
        'getAssets',
        'then',
        'logError',
        'pickMultiple',
        'error',
        'success',
        'process',
        'getVersion',
        'publish',
        'apiErrorHandler'
      ]);

      $provide.constant('logger', {
        logError: stubs.logError
      });

      $provide.value('app/common/ReloadNotification.es6', {
        default: {
          apiErrorHandler: stubs.apiErrorHandler
        }
      });

      $provide.value('services/Filestack.es6', {
        pickMultiple: stubs.pickMultiple
      });

      $provide.value('utils/ResourceUtils.es6', {
        isLegacyOrganization: () => false
      });
      $provide.value('utils/EnvironmentUtils.es6', {
        isInsideMasterEnv: () => false
      });
    });

    const { registerFactory } = this.$inject('NgRegistry.es6');
    registerFactory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);

    ComponentLibrary = this.$inject('@contentful/forma-36-react-components');
    ComponentLibrary.Notification.error = stubs.error;
    ComponentLibrary.Notification.success = stubs.success;

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
    spaceContext.publishedCTs = { getAllBare: () => [] };

    const $controller = this.$inject('$controller');
    $controller('AssetListController', { $scope: scope });
    scope.selection.updateList = sinon.stub();
  });

  describe('on search change', () => {
    beforeEach(() => {
      scope.context.view = {};
      scope.$digest();
    });

    describe('if search is not defined', () => {
      it('list is not defined', () => {
        expect(scope.context.list).toBeUndefined();
      });
    });

    describe('if search is set', () => {
      beforeEach(() => {
        scope.context.view.searchText = 'thing';
        scope.context.view.searchFilters = [];
        scope.$digest();
      });

      it('page is set to the first one', () => {
        expect(scope.searchController.paginator.getPage()).toBe(0);
      });
    });
  });

  describe('page parameters change trigger assets reset', () => {
    beforeEach(() => {
      stubs.reset = sinon.stub(scope.searchController, 'resetAssets');
    });

    afterEach(() => {
      stubs.reset.restore();
    });

    it('search', () => {
      scope.context.view = {};
      scope.searchController.paginator.setPage(0);
      scope.$digest();
      stubs.reset.restore();
      stubs.reset = sinon.stub(scope.searchController, 'resetAssets');
      scope.context.view.searchText = 'thing';
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
    });

    it('page', () => {
      scope.searchController.paginator.setPage(1);
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('page length', () => {
      scope.pageLength = 10;
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('list', () => {
      scope.context.list = 'all';
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('space id', () => {
      stubs.id = sinon.stub(spaceContext.space, 'getId');
      stubs.id.returns(123);
      scope.$digest();
      sinon.assert.called(stubs.reset);
      stubs.id.restore();
    });
  });

  describe('resetting assets', () => {
    let assets;
    beforeEach(() => {
      assets = createAssets(30);
      getAssets.resolve(assets);
    });

    it('unsets isSearching flag if successful', () => {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.context.isSearching).toBe(false);
    });

    it('loads assets', () => {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(stubs.getAssets);
    });

    it('sets assets num on the paginator', () => {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.searchController.paginator.getTotal()).toEqual(30);
    });

    it('sets assets on scope', () => {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.assets).toEqual(assets);
    });

    it('filters out deleted assets', () => {
      assets[0].isDeleted = _.constant(true);
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.assets.length).toBe(29);
      expect(scope.assets.indexOf(assets[0])).toBe(-1);
    });

    it('updates selected items with retrieved list', () => {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(scope.selection.updateList.withArgs(assets));
    });

    describe('creates a query object', () => {
      it('with a defined order', () => {
        scope.context.list = 'all';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', () => {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].limit).toEqual(40);
      });

      it('with a defined skip param', () => {
        const SKIP = 1337;
        scope.searchController.paginator.getSkipParam = sinon.stub().returns(SKIP);
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.lastCall.args[0].skip).toBe(SKIP);
      });
    });
  });

  describe('Api Errors', () => {
    beforeEach(function() {
      stubs.getAssets.returns($q.reject({ statusCode: 500 }));
    });

    it('should cause resetAssets to show an error message', function() {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(stubs.apiErrorHandler);
    });

    it('should cause loadMore to show an error message', function() {
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(stubs.apiErrorHandler);
    });
  });

  describe('loadMore', () => {
    let assets;
    beforeEach(() => {
      assets = createAssets(30);

      scope.assets = createAssets(60);

      // loadMore triggers resetEntries which in reality will not
      // run because the promisedLoader prevents that. In this test
      // the PromisedLoader is stubbed, so we need to fake
      // resetEntries not running:
      scope.searchController.resetAssets = sinon.stub();

      scope.searchController.paginator.isAtLast = sinon.stub().returns(false);
    });

    it('doesnt load if on last page', () => {
      scope.searchController.paginator.isAtLast.returns(true);
      scope.searchController.loadMore();
      sinon.assert.notCalled(stubs.getAssets);
    });

    it('paginator count is increased', () => {
      scope.searchController.paginator.setPage(0);
      scope.searchController.loadMore();
      expect(scope.searchController.paginator.getPage()).toBe(1);
    });

    it('gets query params', () => {
      scope.searchController.loadMore();
      scope.$apply();
      expect(stubs.getAssets.args[0][0]).toBeDefined();
    });

    it('should work on the page before the last', () => {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.searchController.paginator.setTotal(47);
      scope.searchController.paginator.setPage(0);
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(stubs.getAssets);
    });

    describe('on successful load response', () => {
      beforeEach(() => {
        getAssets.resolve(assets);
        scope.$apply();
        scope.searchController.paginator.setPage(1);
        scope.searchController.loadMore();
      });

      it('sets num assets', () => {
        scope.$apply();
        expect(scope.searchController.paginator.getTotal()).toEqual(30);
      });

      it('appends assets to scope', () => {
        scope.$apply();
        scope.assets.slice(60).forEach((asset, i) => {
          expect(assets[i]).toBe(asset);
        });
      });
    });

    describe('on failed load response', () => {
      beforeEach(() => {
        getAssets.resolve(assets);
        scope.searchController.paginator.setPage(1);
        scope.$apply(); // trigger resetAssets
        stubs.getAssets.returns($q.resolve());
        sinon.spy(scope.assets, 'push');
        scope.searchController.loadMore();
        scope.$apply(); // trigger loadMore promises
      });

      it('appends assets to scope', () => {
        sinon.assert.notCalled(scope.assets.push);
      });

      it('sends an error', () => {
        sinon.assert.called(stubs.logError);
      });
    });

    describe('on previous page', () => {
      beforeEach(() => {
        scope.$apply(); // trigger resetAssets
        getAssets.reject();
        scope.$apply();
        scope.searchController.paginator.setPage(1);
        sinon.spy(scope.assets, 'push');
        scope.searchController.loadMore();
        scope.$apply();
      });

      it('appends assets to scope', () => {
        sinon.assert.notCalled(scope.assets.push);
      });

      it('pagination count decreases', () => {
        expect(scope.searchController.paginator.getPage()).toBe(1);
      });
    });
  });

  describe('creating multiple assets', () => {
    beforeEach(function() {
      const files = [{ fileName: 'x.jpg' }, { fileName: 'y.png' }];
      scope.searchController.resetAssets = sinon.stub().resolves();
      spaceContext.space.createAsset = sinon.stub();
      stubs.pickMultiple.returns($q.resolve(files));
      stubs.getVersion.returns(2);
      const entity = {
        process: stubs.process,
        getVersion: stubs.getVersion,
        publish: stubs.publish
      };

      spaceContext.space.createAsset
        .onCall(0)
        .returns($q.resolve(entity))
        .onCall(1)
        .returns($q.resolve(entity));
      stubs.publish
        .onCall(0)
        .returns($q.resolve())
        .onCall(1)
        .returns($q.resolve());
      stubs.process
        .onCall(0)
        .returns($q.resolve())
        .onCall(1)
        .returns($q.resolve())
        .onCall(2)
        .returns($q.resolve())
        .onCall(3)
        .returns($q.resolve());

      scope.createMultipleAssets();
      this.$apply();
    });

    it('Filestack.pickMultiple is called', () => {
      sinon.assert.calledOnce(stubs.pickMultiple);
    });

    it('asset is created', () => {
      sinon.assert.calledTwice(spaceContext.space.createAsset);
    });

    it('process is triggered', () => {
      sinon.assert.calledTwice(stubs.process);
    });
  });

  describe('#showNoAssetsAdvice', () => {
    beforeEach(function() {
      scope.context.view = {};
      this.assertShowNoAssetsAdvice = ({ total, term, searching, expected }) => {
        scope.searchController.paginator.setTotal(total);
        scope.context.view.searchText = term;
        scope.context.isSearching = searching;
        expect(scope.showNoAssetsAdvice()).toBe(expected);
      };
    });

    it('is true when there are no entries, no search term and not searching', function() {
      this.assertShowNoAssetsAdvice({ total: 0, term: null, searching: false, expected: true });
    });

    it('is false when there are entries', function() {
      this.assertShowNoAssetsAdvice({ total: 1, term: '', searching: false, expected: false });
    });

    it('is false when there is a search term', function() {
      this.assertShowNoAssetsAdvice({ total: 0, term: 'foo', searching: false, expected: false });
    });

    it('is false when the view is loading', function() {
      this.assertShowNoAssetsAdvice({ total: 0, term: '', searching: true, expected: false });
    });
  });
});
