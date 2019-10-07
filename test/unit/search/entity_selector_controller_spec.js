import sinon from 'sinon';
import _ from 'lodash';
import { $initialize, $inject, $apply } from 'test/utils/ng';

describe('EntitySelectorController', () => {
  beforeEach(async function() {
    await $initialize(this.system);

    const $rootScope = $inject('$rootScope');
    const $controller = $inject('$controller');
    const $timeout = $inject('$timeout');

    this.spaceContext = $inject('mocks/spaceContext').init();
    this.spaceContext.publishedCTs.getAllBare.returns([]);
    this.spaceContext.space.getEntries.defers();

    this.fetch = sinon.stub().resolves({ items: [] });

    const scope = $rootScope.$new();
    scope.spaceContext = this.spaceContext;

    this.createController = function(config = {}, labels = {}) {
      config = { entityType: 'Entry', fetch: this.fetch, ...config };
      this.scope = _.extend(scope, {
        config,
        labels
      });
      this.ctrl = $controller('EntitySelectorController', { $scope: this.scope });
      $apply();
    };

    this.loadMore = function() {
      $timeout.flush();
      this.scope.paginator.isAtLast = _.constant(false);
      this.scope.loadMore();
      $apply();
    };
  });

  const entity = id => ({ sys: { id } });
  const E1 = entity('e1');
  const E2 = entity('e2');
  const E3 = entity('e3');

  it('sets view modes', function() {
    this.createController({ entityType: 'Asset' });
    expect(this.scope.AVAILABLE).not.toBeUndefined();
    expect(this.scope.SELECTED).not.toBeUndefined();
    expect(this.scope.AVAILABLE).not.toBe(this.scope.SELECTED);
  });

  it('sets "available" view mode initially', function() {
    this.createController({ entityType: 'Asset' });
    expect(this.scope.view.mode).toBe(this.scope.AVAILABLE);
  });

  describe('triggering search', () => {
    it('responds to "forceSearch" event', function() {
      this.createController();
      this.scope.$broadcast('forceSearch');
      $apply();
      // (1) init (2) forced
      sinon.assert.calledTwice(this.fetch);
    });

    it('triggers when term >= 1', function() {
      this.createController();
      this.scope.view.searchText = '';
      $apply();
      this.scope.view.searchText = '1';
      $apply();
      sinon.assert.calledTwice(this.fetch);
    });

    it('triggers when clearing', function() {
      this.createController();
      this.scope.view.searchText = '4444';
      $apply();
      this.scope.view.searchText = '333';
      $apply();
      sinon.assert.calledThrice(this.fetch);
    });

    it('triggers when deleting the value', function() {
      this.createController();
      this.scope.view.searchText = '4444';
      $apply();
      delete this.scope.view.searchText;
      $apply();
      sinon.assert.calledThrice(this.fetch);
    });
  });

  describe('search placeholder', () => {
    beforeEach(function() {
      this.expectPlaceholder = function(text) {
        expect(this.scope.getSearchPlaceholder()).toBe(text);
      };
    });

    it('mentions number of searchable entities if more than two', function() {
      this.createController({}, { searchPlaceholder: 'Search %total% entries' });
      this.scope.paginator.getTotal = sinon.stub().returns(2);
      this.expectPlaceholder('Search 2 entries, press down arrow key for help');
    });

    it('does not mention number of searchable entities if only one', function() {
      this.createController({}, { searchPlaceholder: 'Search %total% entries' });
      this.scope.paginator.getTotal = sinon.stub().returns(1);
      this.expectPlaceholder('Search entries, press down arrow key for help');
    });

    it('does not mention number of searchable entities if zero', function() {
      this.createController({}, { searchPlaceholder: 'Search %total% entries' });
      this.scope.paginator.getTotal = sinon.stub().returns(0);
      this.expectPlaceholder('Search entries, press down arrow key for help');
    });

    it('has no advanced search hint when entity type is not entry or asset', function() {
      this.createController({ entityType: 'User' }, { searchPlaceholder: 'Search %total% users' });
      this.scope.paginator.getTotal = sinon.stub().returns(100);
      this.expectPlaceholder('Search 100 users');
    });
  });

  describe('fetching assets', () => {
    it('requests only assets with files', function() {
      this.createController({ entityType: 'Asset' });
      sinon.assert.calledOnceWith(
        this.fetch,
        sinon.match.has('searchFilters', [['fields.file', 'exists', true]])
      );
    });
  });

  describe('fetching entities', () => {
    it('requests first page of results on init', function() {
      this.createController();
      sinon.assert.calledOnce(this.fetch);
      expect(this.scope.paginator.getPage()).toBe(0);
    });

    it('updates total number of entities', function() {
      this.fetch.resolves({ total: 123, items: [] });
      this.createController();
      expect(this.scope.paginator.getTotal()).toBe(123);
    });

    it('does not remove currentlt displayed entities', function() {
      this.createController();
      this.scope.items = [E1];

      this.fetch.resolves({ items: [E2] });
      this.loadMore();

      expect(this.scope.items).toEqual([E1, E2]);
    });

    it('removes duplicates from the fetched page', function() {
      this.fetch.resolves({ items: [E1, E2] });
      this.createController({ noPagination: false });

      this.fetch.resolves({ items: [E2, E3] });
      this.loadMore();

      expect(this.scope.items).toEqual([E1, E2, E3]);
    });

    it('omits assets without associated files', function() {
      const assetWithoutFile = {
        fields: {},
        sys: { id: 'assetWithoutFile', type: 'Asset' }
      };
      const assetWithFile = {
        fields: { file: {} },
        sys: { id: 'assetWithoutFile', type: 'Asset' }
      };
      this.fetch.resolves({
        items: [E1, E2, assetWithoutFile, assetWithFile, E3]
      });
      this.createController();
      expect(this.scope.items).toEqual([E1, E2, assetWithFile, E3]);
    });
  });

  describe('single content type link', () => {
    beforeEach(function() {
      const ctTemplate = { sys: { id: 'ctid' } };
      this.withCtData = data => {
        const ct = { ...ctTemplate, ...data };
        this.spaceContext.publishedCTs.get.withArgs(ct.sys.id).returns({ data: ct });
        this.createController(
          {
            linkedContentTypeIds: [ct.sys.id]
          },
          {}
        );
      };
    });

    it('sets content type on query', function() {
      this.withCtData({});
      expect(this.fetch.firstCall.args[0].contentTypeId).toBe('ctid');
    });

    it('uses Symbol display field for ordering', function() {
      this.withCtData({ displayField: 'x', fields: [{ id: 'x', type: 'Symbol' }] });

      sinon.assert.calledOnce(this.fetch);
      expect(this.fetch.args[0][0].order).toEqual({
        fieldId: 'x',
        direction: 'ascending'
      });
    });

    it('does not use other display fields for ordering', function() {
      this.withCtData({});
      this.withCtData({ displayField: 'y', fields: [] });
      this.withCtData({ displayField: 'x', fields: [{ id: 'x', type: 'Text' }] });

      sinon.assert.calledThrice(this.fetch);
      this.fetch.args.forEach(callArgs => {
        expect(callArgs[0].order).toBeUndefined();
      });
    });
  });

  describe('selection', () => {
    beforeEach(function() {
      this.fetch.resolves({ items: [E1, E2, E3] });
    });

    it('closes dialog with single entity', function() {
      this.createController({ multiple: false });
      const onChange = sinon.spy();
      this.scope.onChange = onChange;
      this.scope.toggleSelection(E1);
      sinon.assert.calledOnce(onChange.withArgs([E1]));
    });

    it('selects multiple entities', function() {
      this.createController({ multiple: true });
      this.scope.toggleSelection(E1);
      this.scope.toggleSelection(E3);
      expectSelected(this.scope, [E1, E3]);
    });

    it('deselects if entity is already selected', function() {
      this.createController({ multiple: true });
      this.scope.toggleSelection(E1);
      expectSelected(this.scope, [E1]);
      this.scope.toggleSelection(E1);
      expectSelected(this.scope, []);
    });

    function expectSelected(scope, selected) {
      expect(scope.selected).toEqual(selected);
      const selectedIds = selected.reduce(
        (obj, val) => ({
          ...obj,
          [val.sys.id]: true
        }),
        {}
      );
      expect(scope.selectedIds).toEqual(selectedIds);
    }
  });
});
