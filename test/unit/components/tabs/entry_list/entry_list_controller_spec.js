import sinon from 'sinon';
import _ from 'lodash';
import { $initialize, $inject, $apply, $removeControllers } from 'test/utils/ng';
import * as accessChecker from 'access_control/AccessChecker';
import * as K from 'test/utils/kefir';

let ListQueryOriginal;

describe('Entry List Controller', () => {
  let scope, spaceContext;

  function createEntries(n) {
    const entries = _.map(new Array(n), () => ({
      isDeleted: _.constant(false),
      data: { fields: [] },
    }));
    Object.defineProperty(entries, 'total', { value: n });
    return entries;
  }

  beforeEach(async function () {
    this.stubs = {
      apiErrorHandler: sinon.stub(),
      getQuery: sinon.stub().resolves({}),
      entryTitle: sinon.stub(),
      accessChecker: sinon.stub(),
    };

    this.system.set('access_control/AccessChecker', {
      ...accessChecker,
      isInitialized$: K.createMockProperty(true),
    });

    this.system.set('analytics/Analytics', {
      track: sinon.stub(),
    });

    this.system.set('classes/EntityFieldValueSpaceContext', {
      entryTitle: this.stubs.entryTitle,
    });

    this.system.set('app/common/ReloadNotification', {
      default: {
        apiErrorHandler: sinon.stub(),
      },
    });

    this.system.set('services/localeStore', {
      default: {
        resetWithSpace: sinon.stub(),
        getDefaultLocale: sinon.stub().returns({ internal_code: 'en-US' }),
      },
    });

    this.system.set('app/ContentList/Search', {
      default: _.noop, // TODO: Test search ui integration.
    });

    this.system.set('app/common/ReloadNotification', {
      default: {
        apiErrorHandler: this.stubs.apiErrorHandler,
      },
    });

    this.system.set('data/EndpointFactory', {
      createSpaceEndpoint: sinon.stub().returns('/spaces/test/'),
    });

    this.system.set('app/ScheduledActions/DataManagement/ScheduledActionsService', {
      getJobs: sinon.stub().resolves([]),
    });

    if (!ListQueryOriginal) {
      ListQueryOriginal = await this.system.import('search/listQuery');
    }

    this.system.set('search/listQuery', {
      ...ListQueryOriginal,
      getForEntries: this.stubs.getQuery,
    });

    this.ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    this.ComponentLibrary.Notification.error = sinon.stub();
    this.ComponentLibrary.Notification.success = sinon.stub();

    await $initialize(this.system);
    await $removeControllers(this.system, ['DisplayFieldsController']);

    scope = $inject('$rootScope').$new();
    scope.context = {};

    spaceContext = $inject('mocks/spaceContext').init();
    scope.spaceContext = spaceContext;

    const ct = {
      getId: _.constant(1),
      data: { fields: [{ id: 'fieldId' }], sys: { id: 1 } },
    };
    spaceContext.publishedCTs.fetch.resolves(ct);
    spaceContext.publishedCTs.getAllBare.returns([]);

    spaceContext.space.getEntries.defers();

    const $controller = $inject('$controller');

    $controller('EntryListController', { $scope: scope });
  });

  describe('on search change', () => {
    it('page is set to the first one', () => {
      scope.paginator.setPage(1);
      scope.$apply();
      expect(scope.paginator.getPage()).toBe(0);
    });
  });

  describe('page parameters change', () => {
    describe('triggers query on change', () => {
      it('page', function () {
        scope.paginator.setPage(1);
        scope.$apply();
        sinon.assert.called(this.stubs.getQuery);
      });
    });
  });

  describe('#updateEntries()', () => {
    let entries;

    beforeEach(() => {
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

    describe('creates a query object', () => {
      beforeEach(function () {
        this.stubs.getQuery.callsFake((...args) => {
          return ListQueryOriginal.getForEntries(...args);
        });
      });

      it('with a default order', () => {
        scope.updateEntries();
        scope.$apply();
        expect(spaceContext.space.getEntries.args[0][0].order).toEqual('-sys.updatedAt');
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
      scope.context.loading = false;
    });

    it('is true when there are no entries', () => {
      scope.entries = null;
      expect(scope.showNoEntriesAdvice()).toBe(true);
      scope.entries = [];
      expect(scope.showNoEntriesAdvice()).toBe(true);
    });
  });

  describe('Api Errors', () => {
    it('shows error notification on 500 err', function () {
      spaceContext.space.getEntries.rejects({ statusCode: 500 });
      scope.updateEntries();
      scope.$apply();
      expect(
        this.ComponentLibrary.Notification.error.calledWith(
          'There was a problem searching Contentful.'
        )
      ).toBe(true);
    });

    it('shows error notification on 400 err', function () {
      spaceContext.space.getEntries.rejects({ statusCode: 400 });
      scope.updateEntries();
      scope.$apply();
      expect(
        this.ComponentLibrary.Notification.error.calledWith(
          'We detected an invalid search query. Please try again.'
        )
      ).toBe(true);
    });
  });

  describe('#hasArchivedEntries', () => {
    let entriesResponse;

    beforeEach(function () {
      scope.showNoEntriesAdvice = _.constant(true);
      entriesResponse = $inject('$q').defer();
      spaceContext.space.getEntries.returns(entriesResponse.promise);
    });

    it('is set to false when showNoEntriesAdvice() changes to true', function () {
      expect(scope.hasArchivedEntries).toBeUndefined();
      $apply();
      expect(scope.hasArchivedEntries).toBe(false);
    });

    it('gets archived entries when showNoEntries() changes to true', function () {
      $apply();
      const query = {
        limit: 0,
        'sys.archivedAt[exists]': true,
      };
      sinon.assert.calledWith(spaceContext.space.getEntries, query);
    });

    it('is set to true when there are archived entries', function () {
      $apply();
      expect(scope.hasArchivedEntries).toBe(false);
      entriesResponse.resolve({ total: 1 });
      $apply();
      expect(scope.hasArchivedEntries).toBe(true);
    });

    it('is set to false when there no are archived entries', function () {
      $apply();
      expect(scope.hasArchivedEntries).toBe(false);
      entriesResponse.resolve({ total: 0 });
      $apply();
      expect(scope.hasArchivedEntries).toBe(false);
    });
  });
});
