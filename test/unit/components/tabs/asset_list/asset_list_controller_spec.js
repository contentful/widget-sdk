'use strict';

describe('Asset List Controller', function () {
  var controller, scope, stubs, $q, $rootScope, getAssets;

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

      $provide.value('analytics', {
        track: stubs.track
      });

      $provide.value('filepicker', {
        pickMultiple: stubs.pickMultiple,
        parseFPFile: stubs.parseFPFile
      });

    });
    inject(function ($injector) {
      $rootScope         = $injector.get('$rootScope');
      $q                 = $injector.get('$q');
      var $controller    = $injector.get('$controller');
      var cfStub         = $injector.get('cfStub');

      getAssets = $q.defer();
      scope = $rootScope.$new();

      scope.tab = {
        params: {}
      };

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      stubs.getAssets.returns(getAssets.promise);
      space.getAssets = stubs.getAssets;

      controller = $controller('AssetListController', {$scope: scope});
    });
  });


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
      sinon.assert.calledOnce(stubs.reset);
    });

    it('page', function () {
      scope.searchController.paginator.page = 1;
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('list', function () {
      scope.tab.params.list = 'all';
      scope.$digest();
      sinon.assert.called(stubs.reset);
    });

    it('space id', function () {
      stubs.id = sinon.stub(scope.spaceContext.space, 'getId');
      stubs.id.returns(123);
      scope.$digest();
      sinon.assert.called(stubs.reset);
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
      getAssets.resolve(assets);

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
      sinon.assert.called(stubs.getAssets);
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
      sinon.assert.called(stubs.switch);
    });

    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.tab.params.list = 'all';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].skip).toBeTruthy();
      });

      // TODO these tests should go into a test for the search query helper
      it('for all list', function() {
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.tab.params.view.searchTerm = 'status:published';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.tab.params.view.searchTerm = 'status:changed';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.getAssets.args[0][0].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.tab.params.view.searchTerm = 'status:archived';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for search term', function() {
        scope.tab.params.view.searchTerm = 'term';
        scope.searchController.resetAssets();
        scope.$apply();
        expect(stubs.getAssets.args[0][0].query).toBe('term');
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
      stubs.getAssets.returns($q.reject({statusCode: 500}));
    }));

    it('should cause resetAssets to show an error message', function () {
      scope.searchController.resetAssets();
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
    });

    it('should cause loadMore to show an error message', function () {
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
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
      sinon.assert.notCalled(stubs.getAssets);
    });

    it('paginator count is increased', function() {
      scope.searchController.paginator.page = 0;
      scope.searchController.loadMore();
      expect(scope.searchController.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.searchController.loadMore();
      scope.$apply();
      expect(stubs.getAssets.args[0][0]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.searchController.paginator.numEntries = 47;
      scope.searchController.paginator.page = 0;
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(stubs.getAssets);
    });

    it('triggers analytics event', function () {
      scope.searchController.loadMore();
      scope.$apply();
      sinon.assert.called(stubs.track);
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        getAssets.resolve(assets);
        scope.$apply();
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
        getAssets.resolve(assets);
        scope.searchController.paginator.page = 1;
        scope.$apply(); //trigger resetAssets
        stubs.getAssets.returns($q.when());
        sinon.spy(scope.assets, 'push');
        scope.searchController.loadMore();
        scope.$apply(); //trigger loadMore promises
      });

      it('appends assets to scope', function () {
        sinon.assert.notCalled(scope.assets.push);
      });

      it('sends an error', function() {
        sinon.assert.called(stubs.logError);
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        scope.$apply(); // trigger resetAssets
        getAssets.reject();
        scope.$apply();
        scope.searchController.paginator.page = 1;
        sinon.spy(scope.assets, 'push');
        scope.searchController.loadMore();
        scope.$apply();
      });

      it('appends assets to scope', function () {
        sinon.assert.notCalled(scope.assets.push);
      });

      it('pagination count decreases', function() {
        expect(scope.searchController.paginator.page).toBe(1);
      });
    });
  });

  describe('when tab becomes active', function () {
    beforeEach(function() {
      scope.searchController.resetAssets = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      sinon.assert.notCalled(scope.searchController.resetAssets);
    }));

    it('resets assets', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      sinon.assert.called(scope.searchController.resetAssets);
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


      scope.spaceContext.space.createAsset
        .onCall(0).returns($q.when(entity))
        .onCall(1).returns($q.when(entity));
      stubs.publish
        .onCall(0).returns($q.when())
        .onCall(1).returns($q.when());
      stubs.process
        .onCall(0).returns($q.when())
        .onCall(1).returns($q.when())
        .onCall(2).returns($q.when())
        .onCall(3).returns($q.when());

      scope.createMultipleAssets();
      $rootScope.$apply();
    });

    it('filepicker is called', function() {
      sinon.assert.calledOnce(stubs.pickMultiple);
    });

    it('asset is created', function() {
      sinon.assert.calledTwice(scope.spaceContext.space.createAsset);
    });

    it('process is triggered', function() {
      sinon.assert.calledTwice(stubs.process);
    });

    it('publish is triggered', function() {
      sinon.assert.calledTwice(stubs.publish);
    });
  });

});
