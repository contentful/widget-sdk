import * as sinon from 'helpers/sinon';

describe('Entry List Controller', () => {
  let scope, spaceContext, ListQuery;

  const VIEW = {
    id: 'VIEW_ID',
    title: 'Derp',
    searchText: 'search input',
    searchFilters: [],
    contentTypeId: 'ctid',
    contentTypeHidden: false,
    displayedFieldIds: ['createdAt', 'updatedAt'],
    order: {
      fieldId: 'createdAt',
      direction: 'descending'
    }
  };

  function createEntries(n) {
    const entries = _.map(new Array(n), () => ({
      isDeleted: _.constant(false),
      data: { fields: [] }
    }));
    Object.defineProperty(entries, 'total', { value: n });
    return entries;
  }

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.removeControllers('DisplayedFieldsController');

      $provide.value('analytics/Analytics.es6', {
        track: sinon.stub()
      });

      $provide.value('TheLocaleStore', {
        resetWithSpace: sinon.stub(),
        getDefaultLocale: sinon.stub().returns({ internal_code: 'en-US' })
      });

      const readStub = (this.readStub = sinon.stub());
      const promise = (this.readPersistedViewPromise = new Promise(resolve => {
        this.resolveReadPersistedView = resolve;
      }));
      $provide.value('data/ListViewPersistor.es6', {
        default: function() {
          return {
            save: sinon.stub().resolves({}),
            read: readStub.returns(promise)
          };
        }
      });

      $provide.value('app/ContentList/Search', {
        default: _.noop // TODO: Test search ui integration.
      });
    });

    scope = this.$inject('$rootScope').$new();
    scope.context = {};

    spaceContext = this.$inject('mocks/spaceContext').init();
    scope.spaceContext = spaceContext;

    const ct = {
      getId: _.constant(1),
      data: { fields: [{ id: 'fieldId' }], sys: { id: 1 } }
    };
    spaceContext.publishedCTs.fetch.resolves(ct);
    spaceContext.publishedCTs.getAllBare.returns([]);

    spaceContext.space.getEntries.defers();

    const $controller = this.$inject('$controller');

    $controller('EntryListController', { $scope: scope });
    scope.selection.updateList = sinon.stub();

    ListQuery = this.$inject('ListQuery');
  });

  describe('initially undefined view', () => {
    beforeEach(function() {
      ListQuery.getForEntries = this.getQuery = sinon.stub().resolves({});
      scope.$apply();
    });

    it('is undefined', () => {
      expect(scope.context.view).toBe(undefined);
    });

    it('does not trigger query', function() {
      sinon.assert.notCalled(this.getQuery);
    });

    it('triggers query after loading view', function*() {
      this.resolveReadPersistedView({});
      yield this.readPersistedViewPromise;
      scope.$apply();

      expect(scope.context.view).not.toBe(undefined);
      sinon.assert.calledOnce(this.getQuery);
    });
  });

  describe('#loadView()', () => {
    beforeEach(function() {
      ListQuery.getForEntries = this.getQuery = sinon.stub().resolves({});
      scope.loadView(VIEW);
    });

    it('sets the view', () => {
      expect(scope.context.view).toEqual(VIEW);
      expect(scope.context.view).not.toBe(VIEW);
    });

    it('resets entries', function() {
      scope.$apply();
      sinon.assert.calledOnce(this.getQuery);
    });

    describe('with `order.fieldId` value not in `displayedFieldIds`', () => {
      const VIEW_WITH_WRONG_ORDER = Object.assign({}, VIEW, {
        displayedFieldIds: ['createdAt', 'updatedAt'],
        order: {
          fieldId: 'publishedAt', // Not in `displayedFieldIds`
          direction: 'descending'
        }
      });

      it('changes `order.fieldId`', () => {
        scope.loadView(VIEW_WITH_WRONG_ORDER);
        scope.$apply();
        const expected = Object.assign({}, VIEW_WITH_WRONG_ORDER, {
          order: {
            fieldId: 'createdAt'
          }
        });
        expect(scope.context.view).toEqual(expected);
      });
    });
  });

  describe('on search change', () => {
    it('page is set to the first one', () => {
      scope.context.view = {};
      scope.paginator.setPage(1);
      scope.$apply();
      scope.context.view.searchText = 'thing';
      scope.$apply();
      expect(scope.paginator.getPage()).toBe(0);
    });
  });

  describe('page parameters change', () => {
    beforeEach(function() {
      ListQuery.getForEntries = this.getQuery = sinon.stub().resolves({});
    });

    it('triggers no query on page change if no view is loaded', function() {
      scope.paginator.setPage(1);
      scope.$apply();
      sinon.assert.notCalled(this.getQuery);
    });

    describe('triggers query on change', () => {
      beforeEach(() => {
        scope.context.view = {};
        scope.$apply();
      });

      it('page', function() {
        scope.paginator.setPage(1);
        scope.$apply();
        sinon.assert.calledTwice(this.getQuery);
      });

      it('`searchText`', function() {
        scope.context.view.searchText = 'thing';
        scope.$apply();
        sinon.assert.calledTwice(this.getQuery);
      });

      it('`searchFilters`', function() {
        scope.context.view.searchFilters = ['__status', '', 'published'];
        scope.$apply();
        sinon.assert.calledTwice(this.getQuery);
      });

      it('`contentTypeId`', function() {
        scope.context.view = { contentTypeId: 'something' };
        scope.$apply();
        sinon.assert.calledTwice(this.getQuery);
      });
    });
  });

  describe('#updateEntries()', () => {
    let entries;

    beforeEach(() => {
      scope.context.view = {};
      entries = createEntries(30);
      scope.$apply();
      spaceContext.space.getEntries.resolve(entries);
      spaceContext.space.getEntries.resetHistory();
    });

    it('sets loading flag', () => {
      scope.updateEntries();
      expect(scope.context.loading).toBe(true);
      scope.$apply();
      expect(scope.context.loading).toBe(false);
    });

    it('sets entries num on the paginator', () => {
      scope.updateEntries();
      spaceContext.space.getEntries.resolve(entries);
      scope.$apply();
      expect(scope.paginator.getTotal()).toEqual(30);
    });

    it('sets entries on scope', () => {
      scope.updateEntries();
      scope.$apply();
      entries.forEach((entry, i) => {
        expect(scope.entries[i]).toBe(entry);
      });
    });

    it('filters out deleted entries', () => {
      entries[0].isDeleted = _.constant(true);
      scope.updateEntries();
      scope.$apply();
      expect(scope.entries.length).toBe(29);
      expect(scope.entries.indexOf(entries[0])).toBe(-1);
    });

    it('updates selected items with retrieved list', () => {
      scope.updateEntries();
      scope.$apply();
      sinon.assert.called(scope.selection.updateList.withArgs(scope.entries));
    });

    describe('creates a query object', () => {
      it('with a default order', () => {
        scope.updateEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
      });

      describe('with a user defined order', () => {
        beforeEach(() => {
          scope.context.view.contentTypeId = 'CT';
          spaceContext.publishedCTs.fetch.withArgs('CT').resolves({
            getId: _.constant('CT'),
            data: {
              fields: [{ id: 'ORDER_FIELD' }]
            }
          });
        });

        it('when the field exists', () => {
          scope.context.view.order = { fieldId: 'ORDER_FIELD', direction: 'descending' };
          scope.$apply();
          expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-fields.ORDER_FIELD');
        });

        it('when the field does not exist', () => {
          scope.context.view.order = { fieldId: 'deletedFieldId', direction: 'descending' };
          scope.$apply();
          expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
        });
      });

      it('with a defined limit', () => {
        scope.updateEntries();
        scope.$apply();
        spaceContext.space.getEntries.resolve(entries);
        expect(spaceContext.space.getEntries.args[0][0].limit).toEqual(40);
      });

      it('with a defined skip param', () => {
        scope.paginator.getSkipParam = sinon.stub().returns(true);
        scope.updateEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].skip).toBeTruthy();
      });
    });
  });

  describe('#showNoEntriesAdvice()', () => {
    beforeEach(() => {
      scope.context.view = {};
      scope.context.loading = false;
    });

    it('is true when there are no entries', () => {
      scope.entries = null;
      expect(scope.showNoEntriesAdvice()).toBe(true);
      scope.entries = [];
      expect(scope.showNoEntriesAdvice()).toBe(true);
    });

    it('is false when there is a search term', () => {
      // @todo dirty hack: need to satisfy other watch
      // search controller should be tested separately (and removed here)
      scope.context.view.order = { fieldId: 'updatedAt' };
      scope.context.view.displayedFieldIds = ['updatedAt'];

      scope.entries = null;
      scope.context.view.searchTerm = 'foo';
      scope.$apply();
      expect(scope.showNoEntriesAdvice()).toBe(false);
    });

    it('is false when there is a content type filter', () => {
      scope.entries = null;
      scope.context.view.contentTypeId = 'foo';
      expect(scope.showNoEntriesAdvice()).toBe(false);
    });

    it('is false when the view is loading', () => {
      scope.entries = [{}];
      scope.context.view.searchTerm = 'foo';
      scope.context.loading = true;
      expect(scope.showNoEntriesAdvice()).toBe(false);
    });
  });

  describe('Api Errors', () => {
    beforeEach(function() {
      this.reloadNotificationHandler = this.$inject('ReloadNotification').apiErrorHandler;
      this.ComponentLibrary = this.$inject('@contentful/forma-36-react-components');
      this.ComponentLibrary.Notification.error = sinon.stub();
      this.ComponentLibrary.Notification.success = sinon.stub();
    });

    it('shows reload notification on 500 err', function() {
      spaceContext.space.getEntries.rejects({ statusCode: 500 });
      scope.context.view = {};
      scope.updateEntries();
      scope.$apply();
      sinon.assert.called(this.reloadNotificationHandler);
    });

    it('shows error notification on 400 err', function() {
      spaceContext.space.getEntries.rejects({ statusCode: 400 });
      scope.context.view = {};
      scope.updateEntries();
      scope.$apply();
      expect(
        this.ComponentLibrary.Notification.error.calledWith(
          'We detected an invalid search query. Please try again.'
        )
      ).toBe(true);
    });

    it('shows error notification on invalid content type', function() {
      const defaultQuery = {
        order: '-sys.updatedAt',
        limit: 40,
        skip: 0,
        'sys.archivedAt[exists]': 'false'
      };
      spaceContext.space.getEntries.onCall(0).rejects({
        statusCode: 400,
        body: {
          details: {
            errors: [
              {
                name: 'unknownContentType',
                value: 'DOESNOTEXIST'
              }
            ]
          }
        }
      });

      spaceContext.space.getEntries.onCall(1).resolves({
        statusCode: 200
      });

      scope.context.view = {
        contentTypeId: 'x',
        anyOtherField: 1
      };
      scope.updateEntries();
      scope.$apply();
      expect(
        this.ComponentLibrary.Notification.error.calledWith(
          `Provided Content Type "x" does not exist. The content type filter has been reset to "Any"`
        )
      ).toBe(true);

      expect(scope.context.view).toEqual({
        contentTypeId: undefined,
        anyOtherField: 1
      });

      expect(
        spaceContext.space.getEntries.calledWith({
          ...defaultQuery,
          content_type: 'x'
        })
      ).toBe(true);

      expect(spaceContext.space.getEntries.calledWith(defaultQuery)).toBe(true);
    });
  });

  describe('#hasArchivedEntries', () => {
    let entriesResponse;

    beforeEach(function() {
      scope.showNoEntriesAdvice = _.constant(true);
      entriesResponse = this.$inject('$q').defer();
      spaceContext.space.getEntries.returns(entriesResponse.promise);
    });

    it('is set to false when showNoEntriesAdvice() changes to true', function() {
      expect(scope.hasArchivedEntries).toBeUndefined();
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
    });

    it('gets archived entries when showNoEntries() changes to true', function() {
      this.$apply();
      const query = {
        limit: 1,
        'sys.archivedAt[exists]': true
      };
      sinon.assert.calledWith(spaceContext.space.getEntries, query);
    });

    it('is set to true when there are archived entries', function() {
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
      entriesResponse.resolve({ total: 1 });
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(true);
    });

    it('is set to false when there no are archived entries', function() {
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
      entriesResponse.resolve({ total: 0 });
      this.$apply();
      expect(scope.hasArchivedEntries).toBe(false);
    });
  });

  describe('Truncating title', function() {
    it('should not change string shorter then 130 simbols', function() {
      this.$apply();
      const title = 'Title';
      scope.spaceContext.entryTitle.returns(title);
      expect(scope.entryTitle(title)).toBe(title);
    });
    it('should not change string with 130 simbols', function() {
      this.$apply();
      const title =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penat';
      scope.spaceContext.entryTitle.returns(title);
      expect(scope.entryTitle(title)).toBe(title);
    });
    it('should cut string longer then 130 simbols', function() {
      this.$apply();
      const title =
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta.';
      const truncatedTitle =
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa qu…';
      scope.spaceContext.entryTitle.returns(title);
      expect(scope.entryTitle(title)).toBe(truncatedTitle);
    });
  });
});
