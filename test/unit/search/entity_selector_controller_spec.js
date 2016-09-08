'use strict';

describe('entitySelector', function () {
  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    const $timeout = this.$inject('$timeout');
    const spaceContext = this.$inject('spaceContext');

    spaceContext.cma = {
      getEntries: this.getEntries = sinon.stub().resolves({items: []}),
      getAssets: this.getAssets = sinon.stub().resolves({items: []})
    };

    this.createController = function (config, ct) {
      this.scope = _.extend($rootScope.$new(), {config: config || {}, singleContentType: ct});
      this.ctrl = $controller('EntitySelectorController', {$scope: this.scope});
      this.$apply();
    };

    this.loadMore = function () {
      $timeout.flush();
      this.scope.paginator.atLast = _.constant(false);
      this.scope.loadMore();
      this.$apply();
    };
  });

  function entity (id) {
    return {sys: {id: id}};
  }

  it('sets view modes', function () {
    this.createController({});
    expect(this.scope.AVAILABLE).toBe(1);
    expect(this.scope.SELECTED).toBe(2);
    expect(this.scope.view.mode).toBe(this.scope.AVAILABLE);
  });

  describe('triggering search', function () {
    it('responds to "forceSearch" event', function () {
      this.createController({linksEntry: true});
      this.scope.$broadcast('forceSearch');
      this.$apply();
      // (1) init (2) forced
      sinon.assert.calledTwice(this.getEntries);
    });

    it('triggers when term >= 4', function () {
      this.createController({linksEntry: true});
      this.scope.view.searchTerm = '333';
      this.$apply();
      this.scope.view.searchTerm = '4444';
      this.$apply();
      sinon.assert.calledTwice(this.getEntries);
    });

    it('triggers when clearing', function () {
      this.createController({linksEntry: true});
      this.scope.view.searchTerm = '4444';
      this.$apply();
      this.scope.view.searchTerm = '333';
      this.$apply();
      sinon.assert.calledThrice(this.getEntries);
    });

    it('triggers when deleting the value', function () {
      this.createController({linksEntry: true});
      this.scope.view.searchTerm = '4444';
      this.$apply();
      delete this.scope.view.searchTerm;
      this.$apply();
      sinon.assert.calledThrice(this.getEntries);
    });
  });

  describe('fetching entities', function () {
    it('requests first page of results on init', function () {
      this.createController({linksEntry: true});
      sinon.assert.calledOnce(this.getEntries);
      expect(this.scope.paginator.page).toBe(0);

      this.createController({linksAsset: true});
      sinon.assert.calledOnce(this.getAssets);
      expect(this.scope.paginator.page).toBe(0);
    });

    it('constructs a query with paginator and search term', function () {
      const getQuery = this.$inject('ListQuery').getForEntries = sinon.stub().resolves({});
      this.createController({linksEntry: true});
      this.scope.view.searchTerm = '4444';
      this.$apply();
      const config = getQuery.lastCall.args[0];
      expect(config.paginator).toBe(this.scope.paginator);
      expect(config.searchTerm).toBe('4444');
    });

    it('uses query extension', function () {
      const qe = {test: true};
      this.createController({linksEntry: true, queryExtension: qe});
      expect(this.getEntries.lastCall.args[0].test).toBe(qe.test);
    });

    it('updates total number of entities', function () {
      this.getEntries.resolves({total: 123, items: []});
      this.createController({linksEntry: true});
      expect(this.scope.paginator.numEntries).toBe(123);
    });

    it('removes duplicates from the fetched page', function () {
      const entities = [entity('e1'), entity('e2')];

      this.getEntries.resolves({total: 2, items: [entities[0]]});
      this.createController({linksEntry: true});
      expect(this.scope.items).toEqual([entities[0]]);

      this.getEntries.resolves({total: 2, items: entities});
      this.scope.$broadcast('forceSearch');
      this.$apply();
      expect(this.scope.items).toEqual(entities);
    });
  });

  describe('single content type link', function () {
    beforeEach(function () {
      this.getQuery = this.$inject('ListQuery').getForEntries = sinon.stub().resolves({});
      this.ct = {getId: _.constant('ctid'), data: {}};
      this.withData = (data) => {
        this.createController({linksEntry: true}, _.extend(this.ct, {data: data}));
      };
    });

    it('sets content type on query', function () {
      this.createController({linksEntry: true}, this.ct);
      sinon.assert.calledOnce(this.getQuery);
      expect(this.getQuery.firstCall.args[0].contentTypeId).toBe('ctid');
    });

    it('uses Symbol display field for ordering', function () {
      this.withData({displayField: 'x', fields: [{id: 'x', type: 'Symbol'}]});
      this.withData({});
      this.withData({displayField: 'y', fields: []});
      this.withData({displayField: 'x', fields: [{id: 'x', type: 'Text'}]});

      expect(this.getQuery.callCount).toBe(4);
      expect(this.getQuery.firstCall.args[0].order).toEqual({
        fieldId: 'x', direction: 'ascending'
      });

      this.getQuery.args.slice(1).forEach((callArgs) => {
        expect(callArgs[0].order).toEqual({
          fieldId: 'updatedAt', direction: 'descending'
        });
      });
    });
  });

  describe('selection', function () {
    beforeEach(function () {
      this.e1 = entity('e1');
      this.e3 = entity('e3');
      this.getEntries.resolves({items: [this.e1, entity('e2'), this.e3]});
    });

    it('closes dialog with single entity', function () {
      this.createController({linksEntry: true, multiple: false});
      const confirm = sinon.spy();
      this.scope.dialog = {confirm: confirm};
      this.scope.toggleSelection(this.e1);
      sinon.assert.calledOnce(confirm.withArgs([this.e1]));
    });

    it('selects multiple entities', function () {
      this.createController({linksEntry: true, multiple: true});
      this.scope.toggleSelection(this.e1);
      this.scope.toggleSelection(this.e3);
      expect(this.scope.selected).toEqual([this.e1, this.e3]);
      expect(this.scope.selectedIds).toEqual({e1: true, e3: true});
    });

    it('deselects if entity is already selected', function () {
      this.createController({linksEntry: true, multiple: true});
      this.scope.toggleSelection(this.e1);
      expect(this.scope.selected).toEqual([this.e1]);
      expect(this.scope.selectedIds).toEqual({e1: true});
      this.scope.toggleSelection(this.e1);
      expect(this.scope.selected).toEqual([]);
      expect(this.scope.selectedIds).toEqual({});
    });
  });
});
