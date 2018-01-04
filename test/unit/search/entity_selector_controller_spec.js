import * as sinon from 'helpers/sinon';

describe('EntitySelectorController', function () {
  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    const $timeout = this.$inject('$timeout');

    this.entitySelector = this.$inject('entitySelector');

    this.fetch = sinon.stub().resolves({items: []});

    this.createController = function (config = {}, labels = {}, singleContentType) {
      config = _.extend({ entityType: 'Entry', fetch: this.fetch }, config);
      this.scope = _.extend($rootScope.$new(), {
        config,
        labels,
        singleContentType
      });
      this.ctrl = $controller('EntitySelectorController', {$scope: this.scope});
      this.$apply();
    };

    this.loadMore = function () {
      $timeout.flush();
      this.scope.paginator.isAtLast = _.constant(false);
      this.scope.loadMore();
      this.$apply();
    };
  });

  function entity (id) {
    return {sys: {id: id}};
  }

  it('sets view modes', function () {
    this.createController({entityType: 'Asset'});
    expect(this.scope.AVAILABLE).toBe(1);
    expect(this.scope.SELECTED).toBe(2);
    expect(this.scope.view.mode).toBe(this.scope.AVAILABLE);
  });

  describe('triggering search', function () {
    it('responds to "forceSearch" event', function () {
      this.createController();
      this.scope.$broadcast('forceSearch');
      this.$apply();
      // (1) init (2) forced
      sinon.assert.calledTwice(this.fetch);
    });

    it('triggers when term >= 1', function () {
      this.createController();
      this.scope.view.searchTerm = '';
      this.$apply();
      this.scope.view.searchTerm = '1';
      this.$apply();
      sinon.assert.calledTwice(this.fetch);
    });

    it('triggers when clearing', function () {
      this.createController();
      this.scope.view.searchTerm = '4444';
      this.$apply();
      this.scope.view.searchTerm = '333';
      this.$apply();
      sinon.assert.calledThrice(this.fetch);
    });

    it('triggers when deleting the value', function () {
      this.createController();
      this.scope.view.searchTerm = '4444';
      this.$apply();
      delete this.scope.view.searchTerm;
      this.$apply();
      sinon.assert.calledThrice(this.fetch);
    });
  });

  describe('search placeholder', function () {
    beforeEach(function () {
      this.expectPlaceholder = function (text) {
        expect(this.scope.getSearchPlaceholder()).toBe(text);
      };
    });

    it('mentions number of searchable entities if more than two', function () {
      this.createController({}, { searchPlaceholder: 'Search %total% entries' });
      this.scope.paginator.getTotal = sinon.stub().returns(2);
      this.expectPlaceholder('Search 2 entries, press down arrow key for help');
    });

    it('does not mention number of searchable entities if only one', function () {
      this.createController({}, { searchPlaceholder: 'Search %total% entries' });
      this.scope.paginator.getTotal = sinon.stub().returns(1);
      this.expectPlaceholder('Search entries, press down arrow key for help');
    });

    it('does not mention number of searchable entities if zero', function () {
      this.createController({}, { searchPlaceholder: 'Search %total% entries' });
      this.scope.paginator.getTotal = sinon.stub().returns(0);
      this.expectPlaceholder('Search entries, press down arrow key for help');
    });

    it('has no advanced search hint when entity type is not entry or asset', function () {
      this.createController({entityType: 'User'}, {searchPlaceholder: 'Search %total% users'});
      this.scope.paginator.getTotal = sinon.stub().returns(100);
      this.expectPlaceholder('Search 100 users');
    });
  });

  describe('fetching entities', function () {
    it('requests first page of results on init', function () {
      this.createController();
      sinon.assert.calledOnce(this.fetch);
      expect(this.scope.paginator.getPage()).toBe(0);
    });

    it('updates total number of entities', function () {
      this.fetch.resolves({total: 123, items: []});
      this.createController();
      expect(this.scope.paginator.getTotal()).toBe(123);
    });

    it('removes duplicates from the fetched page', function () {
      const entities = [entity('e1'), entity('e2')];

      this.fetch.resolves({total: 2, items: [entities[0]]});
      this.createController();
      expect(this.scope.items).toEqual([entities[0]]);

      this.fetch.resolves({total: 2, items: entities});
      this.scope.$broadcast('forceSearch');
      this.$apply();
      expect(this.scope.items).toEqual(entities);
    });
  });

  describe('single content type link', function () {
    beforeEach(function () {
      this.ct = {getId: _.constant('ctid'), data: {}};
      this.withData = (data) => {
        this.createController({entityType: 'Entry'}, {}, _.extend(this.ct, {data: data}));
      };
    });

    it('sets content type on query', function () {
      this.createController({}, {}, this.ct);
      expect(this.fetch.firstCall.args[0].contentTypeId).toBe('ctid');
    });

    it('uses Symbol display field for ordering', function () {
      this.withData({displayField: 'x', fields: [{id: 'x', type: 'Symbol'}]});
      this.withData({});
      this.withData({displayField: 'y', fields: []});
      this.withData({displayField: 'x', fields: [{id: 'x', type: 'Text'}]});

      expect(this.fetch.callCount).toBe(4);
      expect(this.fetch.firstCall.args[0].order).toEqual({
        fieldId: 'x', direction: 'ascending'
      });

      this.fetch.args.slice(1).forEach((callArgs) => {
        expect(callArgs[0].order).toBeUndefined();
      });
    });
  });

  describe('selection', function () {
    beforeEach(function () {
      this.e1 = entity('e1');
      this.e3 = entity('e3');
      this.fetch.resolves({items: [this.e1, entity('e2'), this.e3]});
    });

    it('closes dialog with single entity', function () {
      this.createController({multiple: false});
      const confirm = sinon.spy();
      this.scope.dialog = {confirm: confirm};
      this.scope.toggleSelection(this.e1);
      sinon.assert.calledOnce(confirm.withArgs([this.e1]));
    });

    it('selects multiple entities', function () {
      this.createController({multiple: true});
      this.scope.toggleSelection(this.e1);
      this.scope.toggleSelection(this.e3);
      expect(this.scope.selected).toEqual([this.e1, this.e3]);
      expect(this.scope.selectedIds).toEqual({e1: true, e3: true});
    });

    it('deselects if entity is already selected', function () {
      this.createController({multiple: true});
      this.scope.toggleSelection(this.e1);
      expect(this.scope.selected).toEqual([this.e1]);
      expect(this.scope.selectedIds).toEqual({e1: true});
      this.scope.toggleSelection(this.e1);
      expect(this.scope.selected).toEqual([]);
      expect(this.scope.selectedIds).toEqual({});
    });
  });
});
