'use strict';

angular.module('contentful')
.controller('EntitySelectorController', ['require', '$scope', function EntitySelectorController (require, $scope) {

  var $timeout = require('$timeout');
  var spaceContext = require('spaceContext');
  var ListQuery = require('ListQuery');
  var Paginator = require('Paginator');
  var createQueue = require('overridingRequestQueue');
  var EntityHelpers = require('EntityHelpers');

  var MINIMAL_TRIGGERING_LEN = 4;
  var MODES = {AVAILABLE: 1, SELECTED: 2};

  var config = $scope.config;
  var queryMethod = config.linksEntry ? 'getForEntries' : 'getForAssets';
  var fetchMethod = config.linksEntry ? 'getEntries' : 'getAssets';
  var itemsById = {};

  var load = createQueue(fetch, function (resultPromise) {
    resultPromise.then(handleResponse);
  });

  _.extend($scope, MODES, {
    spaceContext: spaceContext,
    view: {mode: MODES.AVAILABLE},
    paginator: Paginator.create(),
    items: [],
    selected: [],
    selectedIds: {},
    toggleSelection: toggleSelection,
    loadMore: loadMore,
    helpers: EntityHelpers.newByType(config.entityType, config.locale)
  });

  $scope.$watch('view.searchTerm', handleTermChange);
  $scope.$on('forceSearch', resetAndLoad);

  resetAndLoad();

  function fetch () {
    $scope.isLoading = true;
    return ListQuery[queryMethod](getParams())
    .then(function (query) {
      query = _.extend(query, config.queryExtension);
      return spaceContext.cma[fetchMethod](query);
    });
  }

  function getParams () {
    var params = {
      searchTerm: $scope.view.searchTerm,
      order: getOrder(),
      paginator: $scope.paginator
    };

    if (config.linksEntry && $scope.singleContentType) {
      params.contentTypeId = $scope.singleContentType.getId();
    }

    return params;
  }

  function getOrder () {
    var ct = $scope.singleContentType;

    if (ct) {
      var displayField = _.find(ct.data.fields, {id: ct.data.displayField});
      if (displayField && displayField.type === 'Symbol' && displayField.id) {
        return {fieldId: displayField.id, direction: 'ascending'};
      }
    }
  }

  function toggleSelection (entity) {
    if (!config.multiple) {
      $scope.dialog.confirm([entity]);
    } else if (!$scope.selectedIds[entity.sys.id]) {
      $scope.selected.push(entity);
      $scope.selectedIds[entity.sys.id] = true;
    } else {
      deselect(entity);
    }
  }

  function deselect (entity) {
    delete $scope.selectedIds[entity.sys.id];
    var index = $scope.selected.indexOf(entity);
    if (index > -1) {
      $scope.selected.splice(index, 1);
    }
  }

  function handleTermChange (term, prev) {
    if (isTermTriggering(term) || isClearingTerm(term, prev)) {
      resetAndLoad();
    }
  }

  function isTermTriggering (term) {
    return _.isString(term) && term.length >= MINIMAL_TRIGGERING_LEN;
  }

  function isClearingTerm (term, prev) {
    return _.isString(prev) && (!_.isString(term) || term.length < prev.length);
  }

  function handleResponse (res) {
    $scope.paginator.setTotal(res.total);
    $scope.items.push.apply($scope.items, getItemsToAdd(res));

    $timeout(function () {
      $scope.isLoading = false;
    });
  }

  function getItemsToAdd (res) {
    return _.transform(res.items, function (acc, item) {
      var id = dotty.get(item, 'sys.id');
      if (id && !itemsById[id]) {
        itemsById[id] = item;
        acc.push(item);
      }
    }, []);
  }

  function resetAndLoad () {
    $scope.items = [];
    itemsById = {};
    $scope.paginator.setTotal(0);
    $scope.paginator.setPage(0);
    load();
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.isAtLast()) {
      $scope.paginator.next();
      load();
    }
  }
}]);
