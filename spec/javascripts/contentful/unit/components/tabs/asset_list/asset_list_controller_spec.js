'use strict';

describe('Asset List Controller', function () {
  var controller, scope, stubs;

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
        'load',
        'then',
        'captureError'
      ]);
      $provide.value('sentry', {
        captureError: stubs.captureError
      });

      $provide.value('analytics', {
        track: stubs.track
      });
    });
    inject(function ($rootScope, $controller, cfStub, PromisedLoader) {
      stubs.load = sinon.stub(PromisedLoader.prototype, 'load');
      stubs.load.returns({
        then: stubs.then
      });

      scope = $rootScope.$new();

      scope.tab = {
        params: {}
      };

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      controller = $controller('AssetListCtrl', {$scope: scope});
    });
  });


  afterEach(inject(function ($log) {
    stubs.load.restore();
    $log.assertEmpty();
  }));

  describe('on search term change', function () {

    describe('if term is null', function () {
      beforeEach(function () {
        scope.searchTerm = null;
        scope.$digest();
      });

      it('list is not defined', function () {
        expect(scope.tab.params.list).toBeUndefined();
      });
    });

    describe('if term is set', function () {
      beforeEach(function () {
        scope.searchTerm = 'thing';
        scope.$digest();
      });

      it('page is set to the first one', function () {
        expect(scope.paginator.page).toBe(0);
      });
    });

  });


  describe('page parameters change trigger assets reset', function () {
    beforeEach(function () {
      stubs.reset = sinon.stub(scope, 'resetAssets');
    });

    afterEach(function () {
      stubs.reset.restore();
    });

    it('search term', function () {
      scope.tab.params.list = 'all';
      scope.paginator.page = 0;
      scope.$digest();
      stubs.reset.restore();
      stubs.reset = sinon.stub(scope, 'resetAssets');
      scope.searchTerm = 'thing';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('page', function () {
      scope.paginator.page = 1;
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

      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
    });

    it('loads assets', function() {
      scope.resetAssets();
      scope.$apply();
      expect(stubs.load).toBeCalled();
    });

    it('sets assets num on the paginator', function() {
      scope.resetAssets();
      scope.$apply();
      expect(scope.paginator.numEntries).toEqual(30);
    });

    it('sets assets on scope', function() {
      scope.resetAssets();
      scope.$apply();
      expect(scope.assets).toBe(assets);
    });

    it('switches the selection base set', function() {
      scope.resetAssets();
      scope.$apply();
      expect(stubs.switch).toBeCalled();
    });

    it('tracks analytics event', function() {
      scope.resetAssets();
      scope.$apply();
      expect(stubs.track).toBeCalled();
    });

    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.tab.params.list = 'all';
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2].skip).toBeTruthy();
      });

      // TODO these tests should go into a test for the search query helper
      it('for all list', function() {
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.searchTerm = 'status:published';
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.searchTerm = 'status:changed';
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.load.args[0][2].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.searchTerm = 'status:archived';
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for search term', function() {
        scope.searchTerm = 'term';
        scope.resetAssets();
        scope.$apply();
        expect(stubs.load.args[0][2].query).toBe('term');
      });
    });
  });

  it('has a query', function() {
    scope.tab.params.list = 'all';
    scope.searchTerm = 'term';
    expect(scope.hasQuery()).toBeTruthy();
  });

  it('has no query', function() {
    scope.tab.params.list = 'all';
    scope.searchTerm = null;
    expect(scope.hasQuery()).toBeFalsy();
  });

  describe('loadMore', function () {
    var assets;
    beforeEach(function() {
      assets = [];
      Object.defineProperty(assets, 'total', {value: 30});

      scope.assets = new Array(60);

      stubs.switch = sinon.stub();
      scope.selection = {
        setBaseSize: sinon.stub(),
        switchBaseSet: stubs.switch
      };

      scope.paginator.atLast = sinon.stub();
      scope.paginator.atLast.returns(false);
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      scope.loadMore();
      expect(stubs.load).not.toBeCalled();
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      scope.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.loadMore();
      scope.$apply();
      expect(stubs.load.args[0][2]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      scope.$apply();
      expect(stubs.load).toBeCalled();
    });

    it('triggers analytics event', function () {
      scope.loadMore();
      scope.$apply();
      expect(stubs.track).toBeCalled();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        stubs.then.callsArgWith(0, assets);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('sets num assets', function() {
        scope.$apply();
        expect(scope.paginator.numEntries).toEqual(30);
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
        stubs.load.returns(assets);
        scope.paginator.page = 1;
        scope.$apply(); //trigger resetAssets
        stubs.load.returns(null);
        scope.loadMore();
        scope.$apply(); //trigger loadMore promises
      });

      it('appends assets to scope', function () {
        expect(scope.assets.push).not.toBeCalled();
      });

      it('sends an error', function() {
        expect(stubs.captureError).toBeCalled();
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        scope.$apply(); // trigger resetAssets
        stubs.then.callsArg(1);
        scope.paginator.page = 1;
        scope.loadMore();
        scope.$apply();
      });

      it('appends assets to scope', function () {
        expect(scope.assets.push).not.toBeCalled();
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
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
      scope.resetAssets = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      expect(scope.resetAssets).not.toBeCalled();
    }));

    it('resets assets', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.resetAssets).toBeCalled();
    }));
  });

});
