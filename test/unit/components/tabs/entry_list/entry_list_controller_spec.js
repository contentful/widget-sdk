'use strict';

describe('Entry List Controller', function () {
  var controller, scope;
  var stubs, getEntries;
  var createController;
  var $q;

  beforeEach(function () {
    var self = this;
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

      self.TheLocaleStoreMock = {
        getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'})
      };
      $provide.value('TheLocaleStore', self.TheLocaleStoreMock);
    });
    inject(function ($rootScope, $controller, cfStub, PromisedLoader, _$q_) {
      this.$rootScope = $rootScope;
      $q = _$q_;
      scope = $rootScope.$new();

      scope.context = {};

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
        contentTypeHidden: false,
        displayedFieldIds: ['field1', 'field2'],
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
      expect(_.isEqual(scope.context.view, loaded)).toBe(true);
      expect(scope.context.view).not.toBe(loaded);
    });

    it('resets entries', function() {
      sinon.assert.called(scope.resetEntries);
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
        expect(scope.context.list).toBeUndefined();
      });

      it('contentTypeId is not defined', function () {
        expect(scope.context.contentTypeId).toBeUndefined();
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

  describe('handles entityDeleted event', function() {
    beforeEach(inject(function(cfStub) {
      createController();
      var space = cfStub.space('test');
      var removedEntity = cfStub.entry(space, 'entry2', 'type', {}, {sys: {version:1}});
      scope.entries = [
        cfStub.entry(space, 'entry1'),
        removedEntity,
        cfStub.entry(space, 'entry3')
      ];

      scope.entry = removedEntity;

      this.$rootScope.$broadcast('entityDeleted', removedEntity);
      scope.$digest();
    }));

    it('has 2 entries after deletion', function () {
      expect(scope.entries.length).toEqual(2);
    });

    it('has entry1', function () {
      expect(scope.entries[0].getId()).toEqual('entry1');
    });

    it('has entry3', function () {
      expect(scope.entries[1].getId()).toEqual('entry3');
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
      scope.context.searchTerm = 'thing';
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
    });

    it('page', function () {
      scope.paginator.page = 1;
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
    });

    it('page length', function () {
      scope.pageLength = 10;
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
    });

    it('contentTypeId', function () {
      scope.context.view.contentTypeId = 'something';
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
    });

    it('space id', function () {
      stubs.id = sinon.stub(scope.spaceContext.space, 'getId').returns(123);
      scope.$digest();
      sinon.assert.calledOnce(stubs.reset);
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
      sinon.assert.called(stubs.switch);
    });

    describe('creates a query object', function() {
      it('with a default order', function() {
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
      });

      describe('with a user defined order', function() {
        beforeEach(function() {
          scope.spaceContext.getPublishedContentType = sinon.stub();
          scope.spaceContext.getPublishedContentType.returns({
            data: {
              fields: [
                {id: 'fieldId'}
              ]
            }
          });
        });

        it('when the field exists', function() {
          scope.context.view.order.fieldId = 'fieldId';
          scope.resetEntries();
          scope.$apply();
          expect(scope.spaceContext.space.getEntries.args[0][0].order).toEqual('-fields.fieldId.en-US');
        });

        it('when the field does not exist', function() {
          scope.context.view.order.fieldId = 'deletedFieldId';
          scope.resetEntries();
          scope.$apply();
          expect(scope.spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
        });
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
        scope.context.view.searchTerm = 'status:published';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.context.view.searchTerm = 'status:changed';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(scope.spaceContext.space.getEntries.args[0][0].changed).toBe('true');
      });

      it('for draft list', function() {
        scope.context.view.searchTerm = 'status:draft';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.publishedVersion[exists]']).toBe('false');
        expect(scope.spaceContext.space.getEntries.args[0][0].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.context.view.searchTerm = 'status:archived';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for contentType list', function() {
        pending('Need to change the test so that the content type is actually found');
        scope.context.view.contentTypeId = 'ct1';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0]['content_type']).toBe('ct1');
      });

      it('for search term', function() {
        scope.context.view.searchTerm = 'term';
        scope.resetEntries();
        scope.$apply();
        expect(scope.spaceContext.space.getEntries.args[0][0].query).toBe('term');
      });
    });
  });

  describe('#showNoEntriesAdvice()', function () {

    beforeEach(function () {
      createController();
    });

    it('is true when there are no entries', function () {
      scope.entries = null;
      expect(scope.showNoEntriesAdvice()).toBe(true);
      scope.entries = [];
      expect(scope.showNoEntriesAdvice()).toBe(true);
    });

    it('is false when there is a search term', function () {
      scope.entries = null;
      scope.context.view.searchTerm = 'foo';
      expect(scope.showNoEntriesAdvice()).toBe(false);
    });

    it('is false when there is a content type filter', function () {
      scope.entries = null;
      scope.context.view.contentTypeId = 'foo';
      expect(scope.showNoEntriesAdvice()).toBe(false);
    });
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
      sinon.assert.notCalled(scope.spaceContext.space.getEntries);
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
      sinon.assert.called(scope.spaceContext.space.getEntries);
    });

    it('triggers analytics event', function () {
      scope.loadMore();
      scope.$apply();
      sinon.assert.called(stubs.track);
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
        scope.entries = [];
        sinon.stub(scope.entries, 'push');
        scope.loadMore();
        scope.$apply();
        getEntries.resolve(null);
        scope.$apply();
      });

      it('appends no entries to scope', function () {
        sinon.assert.notCalled(scope.entries.push);
      });

      it('sends an error', function() {
        sinon.assert.called(stubs.logError);
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
      sinon.assert.called(apiErrorHandler);
    });

    it('should cause loadMore to show an error message', function () {
      scope.loadMore();
      getEntries.reject({statusCode: 500});
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
    });
  });
});
