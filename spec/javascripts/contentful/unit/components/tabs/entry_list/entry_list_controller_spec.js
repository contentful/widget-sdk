'use strict';

describe('Entry List Controller', function () {
  var controller, scope;
  var stubs;

  var makeEntry = function (sys) {
    var entry;
    inject(function (contentfulClient) {
      entry = new contentfulClient.Entity({ sys: sys || {} });
    });
    stubs.deleted = sinon.stub(entry, 'isDeleted');
    stubs.published = sinon.stub(entry, 'isPublished');
    stubs.hasUnpublishedChanges = sinon.stub(entry, 'hasUnpublishedChanges');
    entry.isArchived = stubs.archived;
    entry.getContentTypeId = stubs.getContentTypeId;
    return entry;
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'archived',
        'getContentTypeId',
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

      controller = $controller('EntryListCtrl', {$scope: scope});
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

      it('contentTypeId is not defined', function () {
        expect(scope.tab.params.contentTypeId).toBeUndefined();
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

  describe('page parameters change trigger entries reset', function () {
    beforeEach(function () {
      stubs.reset = sinon.stub(scope, 'resetEntries');
      scope.$digest();
    });

    afterEach(function () {
      stubs.reset.restore();
    });

    it('search term', function () {
      scope.tab.params.list = 'all';
      scope.tab.params.contentTypeId = null;
      scope.paginator.page = 0;
      scope.$digest();
      stubs.reset.restore();
      stubs.reset = sinon.stub(scope, 'resetEntries');
      scope.searchTerm = 'thing';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('does not update on page', function () {
      scope.paginator.page = 1;
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
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

    it('contentTypeId', function () {
      scope.tab.params.contentTypeId = 'something';
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

  describe('resetting entries', function() {
    var entries;
    beforeEach(function() {
      stubs.switch = sinon.stub();
      entries = {
        total: 30
      };
      stubs.then.callsArgWith(0, entries);

      scope.selection = {
        switchBaseSet: stubs.switch
      };

      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
    });

    it('loads entries', function() {
      scope.resetEntries();
      expect(stubs.load).toBeCalled();
    });

    it('sets entries num on the paginator', function() {
      scope.resetEntries();
      expect(scope.paginator.numEntries).toEqual(30);
    });

    it('sets entries on scope', function() {
      scope.resetEntries();
      expect(scope.entries).toBe(entries);
    });

    it('switches the selection base set', function() {
      scope.resetEntries();
      expect(stubs.switch).toBeCalled();
    });

    it('tracks analytics event', function() {
      scope.resetEntries();
      expect(stubs.track).toBeCalled();
    });

    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.resetEntries();
        expect(stubs.load.args[0][2].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.resetEntries();
        expect(stubs.load.args[0][2].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.resetEntries();
        expect(stubs.load.args[0][2].skip).toBeTruthy();
      });

      it('for all list', function() {
        scope.resetEntries();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.searchTerm = 'status:published';
        scope.resetEntries();
        expect(stubs.load.args[0][2]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.searchTerm = 'status:changed';
        scope.resetEntries();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.load.args[0][2].changed).toBe('true');
      });

      it('for draft list', function() {
        scope.searchTerm = 'status:draft';
        scope.resetEntries();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(stubs.load.args[0][2]['sys.publishedVersion[exists]']).toBe('false');
        expect(stubs.load.args[0][2].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.searchTerm = 'status:archived';
        scope.resetEntries();
        expect(stubs.load.args[0][2]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for contentType list', function() {
        pending('Need to change the test so that the content type is actually found');
        scope.tab.params.contentTypeId = 'ct1';
        scope.resetEntries();
        expect(stubs.load.args[0][2]['content_type']).toBe('ct1');
      });

      it('for search term', function() {
        scope.tab.params.list = '';
        scope.searchTerm = 'term';
        scope.resetEntries();
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
    var entries;
    beforeEach(function() {
      entries = [];
      Object.defineProperty(entries, 'total', {value: 30});

      scope.entries = new Array(60);

      scope.selection = {
        setBaseSize: sinon.stub()
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
      expect(stubs.load.args[0][2]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      expect(stubs.load).toBeCalled();
    });

    it('triggers analytics event', function () {
      scope.loadMore();
      expect(stubs.track).toBeCalled();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        stubs.then.callsArgWith(0, entries);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('sets num entries', function() {
        expect(scope.paginator.numEntries).toEqual(30);
      });

      it('appends entries to scope', function () {
        expect(scope.entries.slice(60)).toEqual(entries);
      });

      it('sets selection base size', function () {
        expect(scope.selection.setBaseSize.args[0][0]).toBe(60);
      });

    });

    it('discards entries already in the list', function () {
      scope.entries = ['a'];
      entries = ['a', 'b', 'c'];
      Object.defineProperty(entries, 'total', {value: 30});
      stubs.then.callsArgWith(0, entries);
      scope.paginator.page = 2;
      scope.loadMore();
      expect(scope.entries).toEqual(['a', 'b', 'c']);
    });

    describe('on failed load response', function() {
      beforeEach(function() {
        stubs.then.callsArgWith(0, null);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push).not.toBeCalled();
      });

      it('sends an error', function() {
        expect(stubs.captureError).toBeCalled();
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        stubs.then.callsArg(1);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push).not.toBeCalled();
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
      });
    });
  });

  describe('status class', function () {
    it('is updated', function () {
      var entry = makeEntry();
      stubs.published.returns(true);
      stubs.hasUnpublishedChanges.returns(true);
      expect(scope.statusClass(entry)).toBe('updated');
    });

    it('is published', function () {
      var entry = makeEntry();
      stubs.published.returns(true);
      stubs.hasUnpublishedChanges.returns(false);
      expect(scope.statusClass(entry)).toBe('published');
    });

    it('is archived', function () {
      var entry = makeEntry();
      stubs.published.returns(false);
      stubs.archived.returns(true);
      expect(scope.statusClass(entry)).toBe('archived');
    });

    it('is draft', function () {
      var entry = makeEntry();
      stubs.published.returns(false);
      stubs.archived.returns(false);
      expect(scope.statusClass(entry)).toBe('draft');
    });
  });

  describe('when tab becomes active', function () {
    beforeEach(function() {
      scope.resetEntries = sinon.stub();
    });

    it('does nothing if its not the current scope tab', inject(function ($rootScope) {
      scope.tab = null;
      $rootScope.$broadcast('tabBecameActive', {});
      expect(scope.resetEntries).not.toBeCalled();
    }));

    it('resets entries', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.resetEntries).toBeCalled();
    }));
  });

});
