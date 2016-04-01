'use strict';

describe('Entry List Controller', function () {
  var scope, spaceContext;
  var getEntries;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('DisplayedFieldsController');

      $provide.value('analytics', {
        track: sinon.stub()
      });

      $provide.value('TheLocaleStore', {
        resetWithSpace: sinon.stub(),
        getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'})
      });
    });

    scope = this.$inject('$rootScope').$new();
    scope.context = {};

    spaceContext = this.$inject('spaceContext');
    var cfStub = this.$inject('cfStub');
    var space = cfStub.space('test');

    var ct = {
      getId: _.constant(1),
      data: { fields: [{ id: 'fieldId'}], sys: { id: 1 }}
    };

    var $q = this.$inject('$q');
    getEntries = $q.defer();
    spaceContext.resetWithSpace(space);
    sinon.stub(space, 'getEntries').returns(getEntries.promise);
    sinon.stub(space, 'getContentTypes').resolves([ct]);
    sinon.stub(spaceContext, 'fetchPublishedContentType').resolves(ct);

    var $controller = this.$inject('$controller');
    $controller('EntryListController', {$scope: scope});
  });

  describe('#loadView()', function() {
    var view;

    beforeEach(function() {
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

    it('sets the view', function () {
      var loaded = _.defaults({
        title: 'New View'
      }, view);
      expect(scope.context.view).toEqual(loaded);
      expect(scope.context.view).not.toBe(view);
    });

    it('resets entries', function() {
      sinon.assert.calledOnce(scope.resetEntries);
    });

  });

  describe('on search term change', function () {

    it('page is set to the first one', function () {
      scope.paginator.page = 1;
      scope.searchTerm = 'thing';
      scope.$digest();
      expect(scope.paginator.page).toBe(0);
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

  });

  describe('page parameters change trigger entries reset', function () {
    beforeEach(function () {
      scope.$digest();
      scope.resetEntries = sinon.stub();
    });

    it('search term', function () {
      scope.context.view.searchTerm = 'thing';
      scope.$digest();
      sinon.assert.calledOnce(scope.resetEntries);
    });

    it('page', function () {
      scope.paginator.page = 1;
      scope.$digest();
      sinon.assert.calledOnce(scope.resetEntries);
    });

    it('page length', function () {
      scope.paginator.pageLength = 10;
      scope.$digest();
      sinon.assert.calledOnce(scope.resetEntries);
    });

    it('contentTypeId', function () {
      scope.context.view.contentTypeId = 'something';
      scope.$digest();
      sinon.assert.calledOnce(scope.resetEntries);
    });

    it('space id', function () {
      spaceContext.space.getId = sinon.stub().returns(123);
      scope.$digest();
      sinon.assert.calledOnce(scope.resetEntries);
    });
  });

  describe('#resetEntries()', function() {
    var entries;

    beforeEach(function() {
      entries = {
        total: 30
      };
      scope.$apply();
      getEntries.resolve(entries);
      spaceContext.space.getEntries.reset();
    });

    it('sets loading flag', function () {
      scope.resetEntries();
      expect(scope.context.loading).toBe(true);
      scope.$apply();
      expect(scope.context.loading).toBe(false);
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

    describe('creates a query object', function() {
      it('with a default order', function() {
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
      });

      describe('with a user defined order', function() {
        beforeEach(function() {
          scope.context.view.contentTypeId = 'CT';
          spaceContext.fetchPublishedContentType.withArgs('CT').resolves({
            getId: _.constant('CT'),
            data: {
              fields: [
                {id: 'ORDER_FIELD'}
              ]
            }
          });
        });

        it('when the field exists', function() {
          scope.context.view.order.fieldId = 'ORDER_FIELD';
          scope.$apply();
          expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-fields.ORDER_FIELD.en-US');
        });

        it('when the field does not exist', function() {
          scope.context.view.order.fieldId = 'deletedFieldId';
          scope.$apply();
          expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
        });
      });

      it('with a defined limit', function() {
        scope.paginator.pageLength = 3;
        scope.resetEntries();
        scope.$apply();
        getEntries.resolve(entries);
        expect(spaceContext.space.getEntries.args[0][0].limit).toEqual(3);
      });

      it('with a defined skip param', function() {
        scope.paginator.skipItems = sinon.stub().returns(true);
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].skip).toBeTruthy();
      });

      // TODO these tests should go into a test for the search query helper
      it('for all list', function() {
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
      });

      it('for published list', function() {
        scope.context.view.searchTerm = 'status:published';
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0]['sys.publishedAt[exists]']).toBe('true');
      });

      it('for changed list', function() {
        scope.context.view.searchTerm = 'status:changed';
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(spaceContext.space.getEntries.args[0][0].changed).toBe('true');
      });

      it('for draft list', function() {
        scope.context.view.searchTerm = 'status:draft';
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('false');
        expect(spaceContext.space.getEntries.args[0][0]['sys.publishedVersion[exists]']).toBe('false');
        expect(spaceContext.space.getEntries.args[0][0].changed).toBe('true');
      });

      it('for archived list', function() {
        scope.context.view.searchTerm = 'status:archived';
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0]['sys.archivedAt[exists]']).toBe('true');
      });

      it('for contentType list', function() {
        pending('Need to change the test so that the content type is actually found');
        scope.context.view.contentTypeId = 'ct1';
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0]['content_type']).toBe('ct1');
      });

      it('for search term', function() {
        scope.context.view.searchTerm = 'term';
        scope.resetEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].query).toBe('term');
      });
    });
  });

  describe('#showNoEntriesAdvice()', function () {

    beforeEach(function () {
      scope.context.view = {};
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

    it('is false when the view is loading', function () {
      scope.entries = [{}];
      scope.context.view.searchTerm = 'foo';
      scope.context.loading = true;
      expect(scope.showNoEntriesAdvice()).toBe(false);
    });
  });

  describe('loadMore', function () {
    function createEntries(n) {
      var entries = _.map(new Array(n), function () {
        return { data: { fields: [] } };
      });
      Object.defineProperty(entries, 'total', {value: n});
      return entries;
    }

    beforeEach(function() {
      scope.paginator.atLast = sinon.stub().returns(false);

      spaceContext.space.getEntries.resolves(createEntries(30));
      scope.$apply();
      spaceContext.space.getEntries.reset();
    });

    it('doesnt load if on last page', function() {
      scope.paginator.atLast.returns(true);
      scope.loadMore();
      sinon.assert.notCalled(spaceContext.space.getEntries);
    });

    it('paginator count is increased', function() {
      scope.paginator.page = 0;
      scope.loadMore();
      expect(scope.paginator.page).toBe(1);
    });

    it('gets query params', function () {
      scope.loadMore();
      scope.$apply();
      expect(spaceContext.space.getEntries.args[0][0]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.numEntries = 47;
      scope.paginator.page = 0;
      scope.loadMore();
      scope.$apply();
      sinon.assert.called(spaceContext.space.getEntries);
    });

    it('triggers analytics event', function () {
      var analytics = this.$inject('analytics');
      scope.loadMore();
      scope.$apply();
      sinon.assert.called(analytics.track);
    });

    describe('on successful load response', function() {
      var entries;

      beforeEach(function() {
        // Bad hack because of implementation. See TODOs in
        // `loadMore()` for more informcation.
        scope.resetEntries = sinon.stub();

        entries = createEntries(30);
        spaceContext.space.getEntries.resolves(entries);
        scope.loadMore();
      });

      it('sets num entries', function() {
        scope.$apply();
        expect(scope.paginator.numEntries).toEqual(30);
      });

      it('appends entries to scope', function () {
        scope.$apply();
        expect(scope.entries.slice(30)).toEqual(entries);
      });
    });

    it('discards entries already in the list', function () {
      scope.entries = ['a'];
      spaceContext.space.getEntries.resolves(['a', 'b', 'c']);
      scope.loadMore();
      scope.$apply();
      expect(scope.entries).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Api Errors', function () {
    var apiErrorHandler;

    beforeEach(inject(function (ReloadNotification){
      apiErrorHandler = ReloadNotification.apiErrorHandler;
      spaceContext.space.getEntries.rejects({statusCode: 500});
    }));

    it('should cause resetEntries to show an error message', function () {
      scope.resetEntries();
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
    });

    it('should cause loadMore to show an error message', function () {
      // Load more only executes when we are not at the last page
      scope.paginator.atLast = sinon.stub().returns(false);

      scope.loadMore();
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
    });
  });

  describe('#hasArchivedEntries', function () {
    var entriesResponse;

    beforeEach(function () {
      scope.showNoEntriesAdvice = _.constant(true);
      entriesResponse = this.$inject('$q').defer();
      spaceContext.space.getEntries.returns(entriesResponse.promise);
    });

    it('is set to false when showNoEntriesAdvice() changes to true', function () {
      expect(scope.hasArchivedEntries).toBeUndefined();
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
    });

    it('gets archived entries when showNoEntries() changes to true', function () {
      this.$apply();
      var query = {
        'limit': 1,
        'sys.archivedAt[exists]': true
      };
      sinon.assert.calledWith(spaceContext.space.getEntries, query);
    });

    it('is set to true when there are archived entries', function () {
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
      entriesResponse.resolve({total: 1});
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(true);
    });

    it('is set to false when there no are archived entries', function () {
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
      entriesResponse.resolve({total: 0});
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
    });
  });
});
