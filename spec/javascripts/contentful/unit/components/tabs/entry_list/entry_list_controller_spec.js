'use strict';

describe('Entry List Controller', function () {
  var controller, scope;
  var loadStub, trackStub, thenStub, captureErrorStub;
  var deletedStub, archivedStub, publishedStub, hasUnpublishedChangesStub, getContentTypeIdStub;

  var makeEntry = function (sys) {
    var entry;
    inject(function (contentfulClient) {
      entry = new contentfulClient.Entity({ sys: sys || {} });
    });
    deletedStub = sinon.stub(entry, 'isDeleted');
    archivedStub = sinon.stub();
    entry.isArchived = archivedStub;
    publishedStub = sinon.stub(entry, 'isPublished');
    hasUnpublishedChangesStub = sinon.stub(entry, 'hasUnpublishedChanges');
    getContentTypeIdStub = sinon.stub();
    entry.getContentTypeId = getContentTypeIdStub;
    return entry;
  };

  beforeEach(function () {
    trackStub = sinon.stub();
    loadStub = sinon.stub();
    thenStub = sinon.stub();
    captureErrorStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('sentry', {
        captureError: captureErrorStub
      });

      $provide.value('analytics', {
        track: trackStub
      });

      function LoaderStub() {}
      LoaderStub.prototype.load = loadStub;
      loadStub.returns({
        then: thenStub
      });
      $provide.value('PromisedLoader', LoaderStub);
    });
    inject(function ($rootScope, $controller, cfStub) {
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

      it('list is defined', function () {
        expect(scope.tab.params.list).toBe('all');
      });

      it('contentTypeId is null', function () {
        expect(scope.tab.params.contentTypeId).toBeNull();
      });

      it('page is set to the first one', function () {
        expect(scope.paginator.page).toBe(0);
      });
    });

  });

  describe('page parameters change trigger entries reset', function () {
    var resetStub;
    beforeEach(function () {
      resetStub = sinon.stub(scope, 'resetEntries');
    });

    afterEach(function () {
      resetStub.restore();
    });

    it('search term', function () {
      scope.tab.params.list = 'all';
      scope.tab.params.contentTypeId = null;
      scope.paginator.page = 0;
      scope.$digest();
      resetStub.restore();
      resetStub = sinon.stub(scope, 'resetEntries');
      scope.searchTerm = 'thing';
      scope.$digest();
      expect(resetStub.calledOnce).toBeTruthy();
    });

    it('page', function () {
      scope.paginator.page = 1;
      scope.$digest();
      expect(resetStub.called).toBeTruthy();
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      expect(resetStub.called).toBeTruthy();
    });

    it('list', function () {
      scope.tab.params.list = 'all';
      scope.$digest();
      expect(resetStub.called).toBeTruthy();
    });

    it('contentTypeId', function () {
      scope.tab.params.contentTypeId = 'something';
      scope.$digest();
      expect(resetStub.called).toBeTruthy();
    });

    it('space id', function () {
      var idStub = sinon.stub(scope.spaceContext.space, 'getId');
      idStub.returns(123);
      scope.$digest();
      expect(resetStub.called).toBeTruthy();
      idStub.restore();
    });
  });

  describe('switching lists', function () {
    var contentType, list;
    var idStub;
    beforeEach(function() {
      idStub = sinon.stub();
      contentType = {
        getId: idStub
      };
      list = 'all';
      scope.resetEntries = sinon.stub();
    });

    it('sets search term to null', function() {
      scope.tab.params.list = list;
      scope.switchList(list);
      expect(scope.searchTerm).toBeNull();
    });

    it('resets current list', function () {
      scope.tab.params.list = list;
      scope.switchList(list);
      expect(scope.resetEntries.called).toBeTruthy();
    });

    it('resets current list for current content type', function () {
      scope.tab.params.list = list;
      scope.tab.params.contentTypeId = 'ct1';
      idStub.returns('ct1');
      scope.switchList(list, contentType);
      expect(scope.resetEntries.called).toBeTruthy();
    });

    it('switches current list', function () {
      scope.switchList(list);
      expect(scope.tab.params.list).toBe(list);
    });

    it('resets pagination page index', function () {
      scope.switchList(list);
      expect(scope.paginator.page).toBe(0);
    });

    it('sets content type id to null if only list', function () {
      scope.switchList(list);
      expect(scope.tab.params.contentTypeId).toBeNull();
    });

    it('switches current content type', function() {
      idStub.returns('ct1');
      scope.switchList(list, contentType);
      expect(scope.tab.params.contentTypeId).toBe('ct1');
    });
  });

  describe('changed list', function () {
    it('entry is included in all', function () {
      var entry = makeEntry();
      deletedStub.returns(false);
      archivedStub.returns(false);
      scope.tab.params.list = 'all';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });

    it('entry is included in published', function () {
      var entry = makeEntry();
      deletedStub.returns(true);
      publishedStub.returns(true);
      scope.tab.params.list = 'published';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });

    it('entry is included in changed', function () {
      var entry = makeEntry();
      deletedStub.returns(true);
      hasUnpublishedChangesStub.returns(true);
      scope.tab.params.list = 'changes';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });

    it('entry is included in draft', function () {
      var entry = makeEntry();
      deletedStub.returns(true);
      hasUnpublishedChangesStub.returns(true);
      publishedStub.returns(false);
      scope.tab.params.list = 'draft';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });

    it('entry is included in archived', function () {
      var entry = makeEntry();
      deletedStub.returns(false);
      archivedStub.returns(true);
      scope.tab.params.list = 'archived';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });

    it('entry is filtered by content type', function () {
      var entry = makeEntry();
      deletedStub.returns(true);
      getContentTypeIdStub.returns('ct1');
      scope.tab.params.contentTypeId = 'ct1';
      scope.tab.params.list = 'contentType';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });

    it('entry is not contained in any list', function () {
      var entry = makeEntry();
      scope.tab.params.list = '';
      expect(scope.visibleInCurrentList(entry)).toBeTruthy();
    });
  });

  describe('resetting entries', function() {
    var switchStub;
    var entries;
    beforeEach(function() {
      switchStub = sinon.stub();
      entries = {
        total: 30
      };
      thenStub.callsArgWith(0, entries);

      scope.selection = {
        switchBaseSet: switchStub
      };

      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
    });

    it('loads entries', function() {
      scope.resetEntries();
      expect(loadStub.called).toBeTruthy();
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
      expect(switchStub.called).toBeTruthy();
    });

    it('tracks analytics event', function() {
      scope.resetEntries();
      expect(trackStub.called).toBeTruthy();
    });

    describe('creates a query object', function() {

      it('with a defined order', function() {
        scope.tab.params.list = 'all';
        scope.resetEntries();
        expect(loadStub.args[0][2].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.tab.params.list = 'all';
        scope.resetEntries();
        expect(loadStub.args[0][2].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.tab.params.list = 'all';
        scope.resetEntries();
        expect(loadStub.args[0][2].skip).toBeTruthy();
      });

      it('for all list', function() {
        scope.tab.params.list = 'all';
        scope.resetEntries();
        expect(loadStub.args[0][2]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.tab.params.list = 'published';
        scope.resetEntries();
        expect(loadStub.args[0][2]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.tab.params.list = 'changed';
        scope.resetEntries();
        expect(loadStub.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(loadStub.args[0][2].changed).toBe('true');
      });

      it('for draft list', function() {
        scope.tab.params.list = 'draft';
        scope.resetEntries();
        expect(loadStub.args[0][2]['sys.archivedAt[exists]']).toBe('false');
        expect(loadStub.args[0][2]['sys.publishedVersion[exists]']).toBe('false');
        expect(loadStub.args[0][2].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.tab.params.list = 'archived';
        scope.resetEntries();
        expect(loadStub.args[0][2]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for contentType list', function() {
        scope.tab.params.list = 'contentType';
        scope.tab.params.contentTypeId = 'ct1';
        scope.resetEntries();
        expect(loadStub.args[0][2]['sys.contentType.sys.id']).toBe('ct1');
      });

      it('for search term', function() {
        scope.tab.params.list = '';
        scope.searchTerm = 'term';
        scope.resetEntries();
        expect(loadStub.args[0][2].query).toBe('term');
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
      entries = {
        total: 30
      };

      scope.entries = {
        push: {
          apply: sinon.stub()
        },
        length: 60
      };

      scope.selection = {
        setBaseSize: sinon.stub()
      };

      scope.paginator.atLast = sinon.stub();
      scope.paginator.atLast.returns(false);
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      scope.loadMore();
      expect(loadStub.called).toBeFalsy();
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      scope.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.loadMore();
      expect(loadStub.args[0][2]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      expect(loadStub.called).toBeTruthy();
    });

    it('triggers analytics event', function () {
      scope.loadMore();
      expect(trackStub.called).toBeTruthy();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        thenStub.callsArgWith(0, entries);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('sets num entries', function() {
        expect(scope.paginator.numEntries).toEqual(30);
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push.apply.args[0][1]).toEqual(entries);
      });

      it('sets selection base size', function () {
        expect(scope.selection.setBaseSize.args[0][0]).toBe(60);
      });
    });

    describe('on failed load response', function() {
      beforeEach(function() {
        thenStub.callsArgWith(0, null);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push.called).toBeFalsy();
      });

      it('sends an error', function() {
        expect(captureErrorStub.called).toBeTruthy();
      });
    });

    describe('on previous page', function() {
      beforeEach(function() {
        thenStub.callsArg(1);
        scope.paginator.page = 1;
        scope.loadMore();
      });

      it('appends entries to scope', function () {
        expect(scope.entries.push.called).toBeFalsy();
      });

      it('pagination count decreases', function() {
        expect(scope.paginator.page).toBe(1);
      });
    });
  });

  describe('status class', function () {
    it('is updated', function () {
      var entry = makeEntry();
      entry.hasUnpublishedChanges();
      publishedStub.returns(true);
      hasUnpublishedChangesStub.returns(true);
      expect(scope.statusClass(entry)).toBe('updated');
    });

    it('is published', function () {
      var entry = makeEntry();
      publishedStub.returns(true);
      hasUnpublishedChangesStub.returns(false);
      expect(scope.statusClass(entry)).toBe('published');
    });

    it('is archived', function () {
      var entry = makeEntry();
      publishedStub.returns(false);
      archivedStub.returns(true);
      expect(scope.statusClass(entry)).toBe('archived');
    });

    it('is draft', function () {
      var entry = makeEntry();
      publishedStub.returns(false);
      archivedStub.returns(false);
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
      expect(scope.resetEntries.called).toBeFalsy();
    }));

    it('resets entries', inject(function($rootScope) {
      scope.tab = {};
      $rootScope.$broadcast('tabBecameActive', scope.tab);
      expect(scope.resetEntries.called).toBeTruthy();
    }));
  });

});
