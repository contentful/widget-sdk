'use strict';

describe('entitySelector', function () {
  beforeEach(function () {
    module('contentful/test');

    var $rootScope = this.$inject('$rootScope');
    var $controller = this.$inject('$controller');
    var $timeout = this.$inject('$timeout');
    var spaceContext = this.$inject('spaceContext');

    spaceContext.space = {
      getEntries: this.getEntries = sinon.stub().resolves([]),
      getAssets: this.getAssets = sinon.stub().resolves([])
    };

    this.createController = function (config) {
      this.scope = _.extend($rootScope.$new(), {config: config || {}});
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
    return {getId: _.constant(id)};
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
      var getQuery = this.$inject('ListQuery').getForEntries = sinon.stub().resolves({});
      this.createController({linksEntry: true});
      this.scope.view.searchTerm = '4444';
      this.$apply();
      var config = getQuery.lastCall.args[0];
      expect(config.paginator).toBe(this.scope.paginator);
      expect(config.searchTerm).toBe('4444');
    });

    it('uses query extension', function () {
      var qe = {test: true};
      this.createController({linksEntry: true, queryExtension: qe});
      expect(this.getEntries.lastCall.args[0].test).toBe(qe.test);
    });

    it('updates total number of entities', function () {
      var items = [];
      items.total = 123;
      this.getEntries.resolves(items);
      this.createController({linksEntry: true});
      expect(this.scope.paginator.numEntries).toBe(123);
    });

    it('appends unique results to list of available items', function () {
      var e1 = entity('e1');
      this.getEntries.resolves([e1]);
      this.createController({linksEntry: true});
      this.getEntries.resolves([e1, entity('e2'), entity('e3')]);
      this.loadMore();
      expect(this.scope.items.length).toBe(3);
    });

    it('filters out items that are already selected', function () {
      this.getEntries.resolves([entity('e1'), entity('e2')]);
      this.createController({linksEntry: true, linkedEntityIds: ['e2', 'e3']});
      expect(this.scope.items.length).toBe(1);
      expect(this.scope.items[0].getId()).toBe('e1');

      this.getEntries.resolves([entity('e3'), entity('e4')]);
      this.loadMore();
      expect(this.scope.items.length).toBe(2);
      expect(this.scope.items[1].getId()).toBe('e4');
    });
  });

  describe('selection', function () {
    beforeEach(function () {
      this.e1 = entity('e1');
      this.e3 = entity('e3');
      this.getEntries.resolves([this.e1, entity('e2'), this.e3]);
    });

    it('closes dialog with single entity', function () {
      this.createController({linksEntry: true, multiple: false});
      var confirm = sinon.spy();
      this.scope.dialog = {confirm: confirm};
      this.scope.select(this.e1);
      sinon.assert.calledOnce(confirm.withArgs([this.e1]));
    });

    it('selects multiple entities', function () {
      this.createController({linksEntry: true, multiple: true});
      this.scope.select(this.e1);
      this.scope.select(this.e3);
      expect(this.scope.selected).toEqual([this.e1, this.e3]);
      expect(this.scope.selectedIds.e1).toBe(true);
      expect(this.scope.selectedIds.e3).toBe(true);
      expect(Object.keys(this.scope.selectedIds).length).toBe(2);
    });

    it('deselects if entity is already selected', function () {
      this.createController({linksEntry: true, multiple: true});
      this.scope.select(this.e1);
      expect(this.scope.selected).toEqual([this.e1]);
      this.scope.deselect(this.e1);
      expect(this.scope.selected).toEqual([]);
      expect(this.scope.selectedIds).toEqual({});
    });
  });
});
