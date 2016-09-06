'use strict';

describe('Entry List Controller', function () {
  let scope, spaceContext;
  let getEntries;

  function createEntries (n) {
    const entries = _.map(new Array(n), function () {
      return { isDeleted: _.constant(false), data: { fields: [] } };
    });
    Object.defineProperty(entries, 'total', {value: n});
    return entries;
  }

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
    const cfStub = this.$inject('cfStub');
    const space = cfStub.space('test');

    const ct = {
      getId: _.constant(1),
      data: {fields: [{id: 'fieldId'}], sys: {id: 1}}
    };

    const $q = this.$inject('$q');
    getEntries = $q.defer();
    spaceContext.resetWithSpace(space);
    sinon.stub(space, 'getEntries').returns(getEntries.promise);
    sinon.stub(space, 'getContentTypes').resolves([ct]);
    sinon.stub(spaceContext, 'fetchPublishedContentType').resolves(ct);

    const $controller = this.$inject('$controller');
    $controller('EntryListController', {$scope: scope});
    scope.selection.updateList = sinon.stub();
  });

  describe('#loadView()', function () {
    let view;

    beforeEach(function () {
      scope.updateEntries = sinon.stub();

      view = {
        id: 'foo',
        title: 'Derp',
        searchTerm: 'search term',
        contentTypeId: 'ctid',
        contentTypeHidden: false,
        displayedFieldIds: ['createAt', 'updatedAt'],
        order: {
          fieldId: 'createdAt',
          direction: 'descending'
        }
      };
      scope.loadView(view);
    });

    it('sets the view', function () {
      const loaded = _.defaults({
        title: 'New View'
      }, view);
      expect(scope.context.view).toEqual(loaded);
      expect(scope.context.view).not.toBe(view);
    });

    it('resets entries', function () {
      scope.$apply();
      sinon.assert.calledOnce(scope.updateEntries);
    });

  });

  describe('on search term change', function () {
    it('page is set to the first one', function () {
      scope.$apply();
      scope.paginator.page(1);
      scope.context.view.searchTerm = 'thing';
      scope.$apply();
      expect(scope.paginator.page()).toBe(0);
    });
  });

  describe('page parameters change trigger entries reset', function () {
    beforeEach(function () {
      scope.$digest();
      this.$inject('ListQuery').getForEntries = this.getQuery = sinon.stub().resolves({});
    });

    it('search term', function () {
      scope.context.view.searchTerm = 'thing';
      scope.$digest();
      sinon.assert.calledOnce(this.getQuery);
    });

    it('page', function () {
      scope.paginator.page(1);
      scope.$digest();
      sinon.assert.calledOnce(this.getQuery);
    });

    it('contentTypeId', function () {
      scope.context.view.contentTypeId = 'something';
      scope.$digest();
      sinon.assert.calledOnce(this.getQuery);
    });
  });

  describe('#updateEntries()', function () {
    let entries;

    beforeEach(function () {
      entries = createEntries(30);
      scope.$apply();
      getEntries.resolve(entries);
      spaceContext.space.getEntries.reset();
    });

    it('sets loading flag', function () {
      scope.updateEntries();
      expect(scope.context.loading).toBe(true);
      scope.$apply();
      expect(scope.context.loading).toBe(false);
    });

    it('sets entries num on the paginator', function () {
      scope.updateEntries();
      getEntries.resolve(entries);
      scope.$apply();
      expect(scope.paginator.total()).toEqual(30);
    });

    it('sets entries on scope', function () {
      scope.updateEntries();
      scope.$apply();
      entries.forEach(function (entry, i) {
        expect(scope.entries[i]).toBe(entry);
      });
    });

    it('filters out deleted entries', function () {
      entries[0].isDeleted = _.constant(true);
      scope.updateEntries();
      scope.$apply();
      expect(scope.entries.length).toBe(29);
      expect(scope.entries.indexOf(entries[0])).toBe(-1);
    });

    it('updates selected items with retrieved list', function () {
      scope.updateEntries();
      scope.$apply();
      sinon.assert.called(scope.selection.updateList.withArgs(scope.entries));
    });

    describe('creates a query object', function () {
      it('with a default order', function () {
        scope.updateEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
      });

      describe('with a user defined order', function () {
        beforeEach(function () {
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

        it('when the field exists', function () {
          scope.context.view.order = {fieldId: 'ORDER_FIELD', direction: 'descending'};
          scope.$apply();
          expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-fields.ORDER_FIELD');
        });

        it('when the field does not exist', function () {
          scope.context.view.order = {fieldId: 'deletedFieldId', direction: 'descending'};
          scope.$apply();
          expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
        });
      });

      it('with a defined limit', function () {
        scope.updateEntries();
        scope.$apply();
        getEntries.resolve(entries);
        expect(spaceContext.space.getEntries.args[0][0].limit).toEqual(40);
      });

      it('with a defined skip param', function () {
        scope.paginator.skipParam = sinon.stub().returns(true);
        scope.updateEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].skip).toBeTruthy();
      });
    });
  });

  describe('#showNoEntriesAdvice()', function () {

    beforeEach(function () {
      scope.context.view = {};
      scope.context.loading = false;
    });

    it('is true when there are no entries', function () {
      scope.entries = null;
      expect(scope.showNoEntriesAdvice()).toBe(true);
      scope.entries = [];
      expect(scope.showNoEntriesAdvice()).toBe(true);
    });

    it('is false when there is a search term', function () {
      // @todo dirty hack: need to satisfy other watch
      // search controller should be tested separately (and removed here)
      scope.context.view.order = {fieldId: 'updatedAt'};
      scope.context.view.displayedFieldIds = ['updatedAt'];

      scope.entries = null;
      scope.context.view.searchTerm = 'foo';
      scope.$apply();
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

  describe('loadNextPage', function () {
    beforeEach(function () {
      scope.paginator.end = sinon.stub().returns(false);
      spaceContext.space.getEntries.resolves(createEntries(30));
      scope.$apply();
      spaceContext.space.getEntries.reset();
    });

    it('doesnt load if on last page', function () {
      scope.paginator.end.returns(true);
      scope.loadNextPage();
      sinon.assert.notCalled(spaceContext.space.getEntries);
    });

    it('paginator count is increased', function () {
      scope.paginator.page(0);
      scope.loadNextPage();
      expect(scope.paginator.page()).toBe(1);
    });

    it('gets query params', function () {
      scope.loadNextPage();
      scope.$apply();
      expect(spaceContext.space.getEntries.args[0][0]).toBeDefined();
    });

    it('should work on the page before the last', function () {
      // Regression test for https://www.pivotaltracker.com/story/show/57743532
      scope.paginator.total(47);
      scope.paginator.page(0);
      scope.loadNextPage();
      scope.$apply();
      sinon.assert.called(spaceContext.space.getEntries);
    });

    describe('on successful load response', function () {
      let entries;

      beforeEach(function () {
        entries = createEntries(30);
        spaceContext.space.getEntries.resolves(entries);
        scope.loadNextPage();
      });

      it('sets num entries', function () {
        scope.$apply();
        expect(scope.paginator.total()).toEqual(30);
      });

      it('appends entries to scope', function () {
        scope.$apply();
        expect(scope.entries.slice(30)).toEqual(entries);
      });
    });

    it('discards entries already in the list', function () {
      scope.entries = createEntries(1);
      const nextResponse = scope.entries.concat(createEntries(2));
      spaceContext.space.getEntries.resolves(nextResponse);
      scope.loadNextPage();
      scope.$apply();
      expect(scope.entries).toEqual(nextResponse);
    });
  });

  describe('Api Errors', function () {
    let apiErrorHandler;

    beforeEach(inject(function (ReloadNotification) {
      apiErrorHandler = ReloadNotification.apiErrorHandler;
      spaceContext.space.getEntries.rejects({statusCode: 500});
    }));

    it('should cause updateEntries to show an error message', function () {
      scope.updateEntries();
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
    });

    it('should cause loadNextPage to show an error message', function () {
      // Load more only executes when we are not at the last page
      scope.paginator.end = sinon.stub().returns(false);

      scope.loadNextPage();
      scope.$apply();
      sinon.assert.called(apiErrorHandler);
    });
  });

  describe('#hasArchivedEntries', function () {
    let entriesResponse;

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
      const query = {
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
