'use strict';

describe('Entry List Controller', function () {
  var controller, scope;
  var stubs, getEntries;
  var createController;
  var $q;

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
        'then',
        'logError',
        'getUIConfig',
        'setUIConfig'
      ]);
      $provide.removeControllers('DisplayedFieldsController');
      $provide.value('logger', {
        logError: stubs.logError
      });

      $provide.value('analytics', {
        track: stubs.track
      });
    });
    inject(function ($rootScope, $controller, cfStub, PromisedLoader, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();

      scope.tab = {
        params: {}
      };

      var space = cfStub.space('test');
      space.getUIConfig = stubs.getUIConfig;
      space.setUIConfig = stubs.setUIConfig;
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      getEntries = $q.defer();
      sinon.stub(scope.spaceContext.space, 'getEntries').returns(getEntries.promise);

      createController = function() {
        controller = $controller('EntryListController', {$scope: scope});
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('loads a ui config view', function() {
    var view;

    beforeEach(function() {
      createController();
      scope.resetEntries = sinon.stub();

      view = {
        id: 'foo',
        title: 'Derp',
        searchTerm: 'search term',
        contentTypeId: 'ctid',
        displayedFields: ['field1', 'field2'],
        order: {
          fieldId: 'fieldid',
          direction: 'descending'
        }
      };
      scope.loadView(view);
    });


    it('sets the view, omitting the id', function () {
      var loaded = _.cloneDeep(view);
      loaded.title = 'New View';
      expect(scope.tab.params.view).toEqual(loaded);
      expect(scope.tab.params.view).not.toBe(loaded);
    });

    it('resets entries', function() {
      expect(scope.resetEntries).toBeCalled();
    });

  });

  xdescribe('gets a path for the field content', function() {
    // TODO turn into test for orderquery
    beforeEach(function() {
      createController();
    });

    it('for sys fields', function() {
      expect(scope.getFieldPath({
        id: 'fieldid',
        sys: true
      })).toEqual('sys.fieldid');
    });

    it('for regular fields', function() {
      expect(scope.getFieldPath({
        id: 'fieldid'
      })).toEqual('fields.fieldid.en-US');
    });
  });

  describe('on search term change', function () {
    beforeEach(function() {
      createController();
    });

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
      createController();
      stubs.reset = sinon.stub(scope, 'resetEntries');
      scope.$digest();
      stubs.reset.restore();
    });

    it('search term', function () {
      scope.tab.params.searchTerm = 'thing';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('page', function () {
      scope.paginator.page = 1;
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('contentTypeId', function () {
      scope.tab.params.view.contentTypeId = 'something';
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
    });

    it('space id', function () {
      stubs.id = sinon.stub(scope.spaceContext.space, 'getId').returns(123);
      scope.$digest();
      expect(stubs.reset).toBeCalledOnce();
      stubs.id.restore();
    });
  });

  describe('resetting entries', function() {
    var entries;
    beforeEach(function() {
      entries = {
        total: 30
      };
      createController();
      scope.$apply();
      getEntries.resolve(entries);
      stubs.switch = sinon.stub();

      scope.selection = {
        switchBaseSet: stubs.switch
      };

      scope.paginator.pageLength = 3;
      scope.paginator.skipItems = sinon.stub();
      scope.paginator.skipItems.returns(true);
      scope.spaceContext.space.getEntries.reset();
    });

    it('sets entries num on the paginator', function() {
      scope.resetEntries();
      scope.$apply();
      getEntries.resolve(entries);
      expect(scope.paginator.numEntries).toEqual(30);
    });

    it('sets entries on scope', function() {
      scope.resetEntries();
      scope.$apply();
      expect(scope.entries).toBe(entries);
    });

    it('switches the selection base set', function() {
      scope.resetEntries();
      scope.$apply();
      getEntries.resolve(entries);
      expect(stubs.switch).toBeCalled();
    });

    describe('creates a query object', function() {
      it('with a defined order', function() {
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
      });

      it('with a defined limit', function() {
        scope.resetEntries();
        scope.$apply();
      getEntries.resolve(entries);
        expect(scope.spaceContext.space.getEntries.args[0][0].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0].skip).toBeTruthy();
      });

      // TODO these tests should go into a test for the search query helper
      it('for all list', function() {
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.tab.params.view.searchTerm = 'status:published';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.tab.params.view.searchTerm = 'status:changed';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(scope.spaceContext.space.getEntries.args[0][0].changed).toBe('true');
      });

      it('for draft list', function() {
        scope.tab.params.view.searchTerm = 'status:draft';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.publishedVersion[exists]']).toBe('false');
        expect(scope.spaceContext.space.getEntries.args[0][0].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.tab.params.view.searchTerm = 'status:archived';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for contentType list', function() {
        pending('Need to change the test so that the content type is actually found');
        scope.tab.params.view.contentTypeId = 'ct1';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['content_type']).toBe('ct1');
      });

      it('for search term', function() {
        scope.tab.params.view.searchTerm = 'term';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0].query).toBe('term');
      });
    });
  });

  it('has a query', function() {
    createController();
    scope.tab.params.view.searchTerm = 'foo';
    expect(scope.hasQuery()).toBeTruthy();
  });

  it('has no query', function() {
    createController();
    scope.tab.params.view.searchTerm = null;
    expect(scope.hasQuery()).toBeFalsy();
  });

  describe('loadMore', function () {
    var entries;
    beforeEach(function() {
      entries = [];
      Object.defineProperty(entries, 'total', {value: 0});

      createController();
      scope.$apply();
      getEntries.resolve(entries);
      scope.$apply();

      entries = [];
      Object.defineProperty(entries, 'total', {value: 30});

      scope.entries = new Array(60);

      stubs.switch = sinon.stub();
      // loadMore as a side effect triggers resetEntries which in reality will not
      // run because the promisedLoader prevents that. In this test
      // the PromisedLoader is stubbed, so we need to fake
      // resetEntries not running:
      scope.resetEntries = sinon.stub();
      scope.selection = {
        setBaseSize: sinon.stub(),
        switchBaseSet: stubs.switch
      };

      scope.paginator.atLast = sinon.stub();
      scope.paginator.atLast.returns(false);
      getEntries = $q.defer();
      scope.spaceContext.space.getEntries.reset();
      scope.spaceContext.space.getEntries.returns(getEntries.promise);
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      scope.loadMore();
      expect(scope.spaceContext.space.getEntries).not.toBeCalled();
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      scope.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.loadMore();
      scope.$apply();
      expect(scope.spaceContext.space.getEntries.args[0][0]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      scope.$apply();
      expect(scope.spaceContext.space.getEntries).toBeCalled();
    });

    it('triggers analytics event', function () {
      scope.loadMore();
      scope.$apply();
      expect(stubs.track).toBeCalled();
    });

    describe('on successful load response', function() {
      beforeEach(function() {
        scope.paginator.page = 1;
        scope.loadMore();
        scope.$apply();
        getEntries.resolve(entries);
        scope.$apply();
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
      scope.paginator.page = 2;
      scope.loadMore();
      scope.$apply();
      getEntries.resolve(entries);
      scope.$apply();
      expect(scope.entries).toEqual(['a', 'b', 'c']);
    });

    describe('on empty load response', function() {
      beforeEach(function() {
        scope.loadMore();
        scope.$apply();
        getEntries.resolve(null);
        scope.$apply();
      });

      it('appends no entries to scope', function () {
        expect(scope.entries.push).not.toBeCalled();
      });

      it('sends an error', function() {
        expect(stubs.logError).toBeCalled();
      });
    });

  });

  describe('Api Errors', function () {
    var apiErrorHandler;
    beforeEach(inject(function (ReloadNotification){
      createController();
      scope.$apply();
      apiErrorHandler = ReloadNotification.apiErrorHandler;
    }));

    it('should cause resetEntries to show an error message', function () {
      scope.resetEntries();
      getEntries.reject({statusCode: 500});
      scope.$apply();
      expect(apiErrorHandler).toBeCalled();
    });

    it('should cause loadMore to show an error message', function () {
      scope.loadMore();
      getEntries.reject({statusCode: 500});
      scope.$apply();
      expect(apiErrorHandler).toBeCalled();
    });
  });


  describe('status class', function () {
    beforeEach(function() {
      createController();
    });

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
      createController();
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
