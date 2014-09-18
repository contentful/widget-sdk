'use strict';

describe('Asset List Controller', function () {
  var controller, scope, stubs, $q, $rootScope;

  var makeAsset = function (sys) {
    var asset;
    inject(function (contentfulClient) {
      asset = new contentfulClient.Entity({ sys: sys || {} });
    });
    stubs.deleted = sinon.stub(asset, 'isDeleted');
    stubs.published = sinon.stub(asset, 'isPublished');
    stubs.hasUnpublishedChanges = sinon.stub(asset, 'hasUnpublishedChanges');
    asset.isArchived = stubs.archived;
    return asset;
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'archived',
        'track',
        'loadCallback',
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

      $provide.value('analytics', {
        track: stubs.track
      });

      $provide.value('filepicker', {
        pickMultiple: stubs.pickMultiple,
        parseFPFile: stubs.parseFPFile
      });

    });
    inject(function ($injector) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      var $controller = $injector.get('$controller');
      var cfStub = $injector.get('cfStub');
      var PromisedLoader = $injector.get('PromisedLoader');

      scope = $rootScope.$new();

      scope.tab = {
        params: {}
      };

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      stubs.loadCallback = sinon.stub(PromisedLoader.prototype, 'loadCallback');
      stubs.loadCallback.returns({
        then: stubs.then
      });

      controller = $controller('AssetListCtrl', {$scope: scope});
    });
  });


  afterEach(inject(function ($log) {
    stubs.loadCallback.restore();
    $log.assertEmpty();
  }));

  describe('on search term change', function () {

    describe('if term is null', function () {
      beforeEach(function () {
        scope.tab.params.view.searchTerm = null;
        scope.$digest();
      });

      it('list is not defined', function () {
        expect(scope.tab.params.list).toBeUndefined();
      });
    });

    describe('if term is set', function () {
      beforeEach(function () {
        scope.tab.params.view.searchTerm = 'thing';
        scope.$digest();
      });

      it('page is set to the first one', function () {
        expect(scope.searchController.paginator.page).toBe(0);
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

    it('search term', function () {
      scope.tab.params.list = 'all';
      scope.searchController.paginator.page = 0;
      scope.$digest();
      stubs.reset.restore();
      stubs.reset = sinon.stub(scope.searchController, 'resetAssets');
      scope.tab.params.view.searchTerm = 'thing';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('page', function () {
      scope.searchController.paginator.page = 1;
      scope.$digest();
      expect(stubs.reset).toBeCalled();
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      expect(stubs.reset).toBeCalled();
    });

    it('list', function () {
      scope.tab.params.list = 'all';
      scope.$digest();
      expect(stubs.reset).toBeCalled();
    });

    it('space id', function () {
      stubs.id = sinon.stub(scope.spaceContext.space, 'getId');
      stubs.id.returns(123);
      scope.$digest();
      expect(stubs.reset).toBeCalled();
      stubs.id.restore();
    });
  });

  describe('resetting assets', function() {
    var assets;
    beforeEach(function() {
      stubs.switch = sinon.stub();
      assets = {
        total: 30
      };
      stubs.then.callsArgWith(0, assets);

      scope.selection = {
        switchBaseSet: stubs.switch
      };

      scope.searchController.paginator.pageLength = 3;
      scope.searchController.paginator.skipItems = sinon.stub();
      scope.searchController.paginator.skipItems.returns(true);
    });

    it('loads assets', function() {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(stubs.loadCallback).toBeCalled();
    });

    it('sets assets num on the paginator', function() {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.searchController.paginator.numEntries).toEqual(30);
    });

    it('sets assets on scope', function() {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(scope.assets).toBe(assets);
    });

    it('switches the selection base set', function() {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(stubs.switch).toBeCalled();
    });

    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.tab.params.list = 'all';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2].skip).toBeTruthy();
      });

      // TODO these tests should go into a test for the search query helper
      it('for all list', function() {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.tab.params.view.searchTerm = 'status:published';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.tab.params.view.searchTerm = 'status:changed';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.loadCallback.args[0][2].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.tab.params.view.searchTerm = 'status:archived';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for search term', function() {
        scope.tab.params.view.searchTerm = 'term';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.loadCallback.args[0][2].query).toBe('term');
      });
    });
  });

  it('has a query', function() {
    scope.tab.params.list = 'all';
    scope.tab.params.view.searchTerm = 'term';
    expect(scope.hasQuery()).toBeTruthy();
  });

  it('has no query', function() {
    scope.tab.params.list = 'all';
    scope.tab.params.view.searchTerm = null;
    expect(scope.hasQuery()).toBeFalsy();
  });

  describe('Api Errors', function () {
    var apiErrorHandler;
    beforeEach(inject(function (ReloadNotification){
      apiErrorHandler = ReloadNotification.apiErrorHandler;
      stubs.loadCallback.returns($q.reject({statusCode: 500}));
    }));

    it('should cause resetAssets to show an error message', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      expect(apiErrorHandler).toBeCalled();
    });

    it('should cause loadMore to show an error message', function () {
      scope.searchController.loadMore();
      scope.$apply();
      expect(apiErrorHandler).toBeCalled();
    });
  });

  describe('loadMore', function () {
    var assets;
    beforeEach(function() {
      assets = [];
      Object.defineProperty(assets, 'total', {value: 30});

      scope.assets = new Array(60);

      stubs.switch = sinon.stub();
      // loadMore triggers resetEntries which in reality will not
      // run because the promisedLoader prevents that. In this test
      // the PromisedLoader is stubbed, so we need to fake
      // resetEntries not running:
      scope.searchController.resetAssets = sinon.stub();
      scope.selection = {
        setBaseSize: sinon.stub(),
        switchBaseSet: stubs.switch
      };

      scope.searchController.paginator.atLast = sinon.stub();
      scope.searchController.paginator.atLast.returns(false);
    });

    it('doesnt load if on last page', function() {
      scope.searchController.paginator.atLast.returns(true);
      scope.searchController.loadMore();
      expect(stubs.loadCallback).not.toBeCalled();
    });

    it('paginator count is increased', function() {
      scope.searchController.paginator.page = 0;
      scope.searchController.loadMore();
      expect(scope.searchController.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.searchController.loadMore();
      scope.$apply();
      expect(stubs.loadCallback.args[0][2]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.searchController.paginator.numEntries = 47;
      scope.searchController.paginator.page = 0;
      scope.searchController.loadMore();
      scope.$apply();
      expect(stubs.loadCallback).toBeCalled();
    });

    it('triggers analytics event', function () {
      scope.searchController.loadMore();
      scope.$apply();
      expect(stubs.track).toBeCalled();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        stubs.then.callsArgWith(0, assets);
        scope.searchController.paginator.page = 1;
        scope.searchController.loadMore();
      });

      it('sets num assets', function() {
        scope.$apply();
        expect(scope.searchController.paginator.numEntries).toEqual(30);
      });

      it('appends assets to scope', function () {
        scope.$apply();
        expect(scope.assets.slice(60)).toEqual(assets);
      });

      it('sets selection base size', function () {
        scope.$apply();
        expect(scope.selection.setBaseSize.args[0][0]).toBe(60);
      });
    });

    describe('on failed load response', function() {
      beforeEach(function() {
        stubs.loadCallback.returns(assets);
        scope.searchController.paginator.page = 1;
        scope.$apply(); //trigger resetAssets
        stubs.loadCallback.returns(null);
        scope.searchController.loadMore();
        scope.$apply(); //trigger loadMore promises
      });

      it('appends assets to scope', function () {
        expect(scope.assets.push).not.toBeCalled();
      });

      it('sends an error', function() {
        expect(stubs.logError).toBeCalled();
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        scope.$apply(); // trigger resetAssets
        stubs.then.callsArg(1);
        scope.searchController.paginator.page = 1;
        scope.searchController.loadMore();
        scope.$apply();
      });

      it('appends assets to scope', function () {
        expect(scope.assets.push).not.toBeCalled();
      });

      it('pagination count decreases', function() {
        expect(scope.searchController.paginator.page).toBe(1);
      });
    });
  });

  describe('status class', function () {
    it('is updated', function () {
      var asset = makeAsset();
      asset.hasUnpublishedChanges();
      stubs.published.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusClass(asset)).toBe('updated');
    });

    it('is published', function () {
      var asset = makeAsset();
      stubs.published.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusClass(asset)).toBe('published');
    });

    it('is archived', function () {
      var asset = makeAsset();
      stubs.published.returns(false);
      stubs.archived.returns(true);
      expect(scope.statusClass(asset)).toBe('archived');
    });

    it('is draft', function () {
      var asset = makeAsset();
      stubs.published.returns(false);
      stubs.archived.returns(false);
      expect(scope.statusClass(asset)).toBe('draft');
    });
  });

  describe('when tab becomes active', function () {
    beforeEach(function() {
      scope.searchController.resetAssets = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      expect(scope.searchController.resetAssets).not.toBeCalled();
    }));

    it('resets assets', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.searchController.resetAssets).toBeCalled();
    }));
  });

  describe('creating multiple assets', function() {
    var files, entity;
    beforeEach(function() {
      files = [{}, {}];
      scope.searchController.resetAssets  = sinon.stub();
      scope.spaceContext.space.getDefaultLocale = sinon.stub();
      scope.spaceContext.space.getDefaultLocale.returns({code: 'en-US'});
      scope.spaceContext.space.createAsset = sinon.stub();
      stubs.pickMultiple.returns($q.when(files));
      stubs.getVersion.returns(2);
      stubs.parseFPFile.returns({fileName: 'file_name.jpg'});
      entity = {process: stubs.process, getVersion: stubs.getVersion, publish: stubs.publish};

      scope.createMultipleAssets();
      $rootScope.$apply();
      scope.spaceContext.space.createAsset.yield(null, entity);
      $rootScope.$apply();
      scope.spaceContext.space.createAsset.yield(null, entity);
      $rootScope.$apply();
      stubs.process.yield();
      $rootScope.$apply();
      stubs.process.yield();
      $rootScope.$apply();
      stubs.publish.yield();
      $rootScope.$apply();
      stubs.publish.yield();
      $rootScope.$apply();
    });

    it('filepicker is called', function() {
      expect(stubs.pickMultiple).toBeCalledOnce();
    });

    it('asset is created', function() {
      expect(scope.spaceContext.space.createAsset).toBeCalledTwice();
    });

    it('process is triggered', function() {
      expect(stubs.process).toBeCalledTwice();
    });

    it('publish is triggered', function() {
      expect(stubs.publish).toBeCalledTwice();
    });
  });

});
