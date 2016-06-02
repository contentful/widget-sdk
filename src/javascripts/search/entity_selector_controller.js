'use strict';

angular.module('contentful')
.controller('EntitySelectorController', ['$injector', '$scope', function EntitySelectorController ($injector, $scope) {

  var $timeout = $injector.get('$timeout');
  var $controller = $injector.get('$controller');
  var spaceContext = $injector.get('spaceContext');
  var ListQuery = $injector.get('ListQuery');
  var Paginator = $injector.get('Paginator');
  var createQueue = $injector.get('overridingRequestQueue');
  var entityStatusController = $controller('EntityStatusController');

  var ORDER = {fieldId: 'updatedAt', direction: 'descending'};
  var MODES = {AVAILABLE: 1, SELECTED: 2};

  _.extend($scope, MODES, {
    spaceContext: spaceContext,
    view: {mode: MODES.AVAILABLE},
    paginator: new Paginator(),
    items: [],
    selected: [],
    selectedIds: {},
    select: select,
    deselect: deselect,
    loadMore: loadMore,
    getStatusClassname: entityStatusController.getClassname
  });

  var queryMethod = $scope.config.linksEntry ? 'getForEntries' : 'getForAssets';
  var fetchMethod = $scope.config.linksEntry ? 'getEntries' : 'getAssets';

  var load = createQueue(fetch, function (resultPromise) {
    resultPromise.then(handleItems);
  });

  $scope.$watch('view.searchTerm', handleTermChange);
  $scope.$on('forceSearch', resetAndLoad);

  function fetch () {
    $scope.isLoading = true;
    return ListQuery[queryMethod](getParams())
    .then(function (query) {
      query = _.extend(query, $scope.config.queryExtension);
      return spaceContext.space[fetchMethod](query);
    });
  }

  function getParams () {
    var params = {
      searchTerm: $scope.view.searchTerm,
      order: ORDER,
      paginator: $scope.paginator
    };

    if ($scope.config.linksEntry && $scope.singleContentType) {
      params.contentType = $scope.singleContentType;
    }

    return params;
  }

  function select (entity) {
    if (!$scope.config.multiple) {
      $scope.dialog.confirm([entity]);
      return;
    }

    if (!$scope.selectedIds[entity.getId()]) {
      $scope.selected.push(entity);
      $scope.selectedIds[entity.getId()] = true;
    } else {
      $scope.deselect(entity);
    }
  }

  function deselect (entity) {
    delete $scope.selectedIds[entity.getId()];
    var index = $scope.selected.indexOf(entity);
    if (index > -1) {
      $scope.selected.splice(index, 1);
    }
  }

  function handleTermChange (term, prev) {
    if (_.isString(term) && term.length >= 4) {
      resetAndLoad();
    } else if (_.isString(prev) && (!_.isString(term) || term.length < prev.length)) {
      resetAndLoad();
    }
  }

  function handleItems (items) {
    $scope.paginator.numEntries = items.total;
    $scope.items.push.apply($scope.items, items);
    $timeout(function () {
      $scope.isInitialized = true;
      $scope.isLoading = false;
    });
  }

  function resetAndLoad () {
    $scope.paginator.page = 0;
    $scope.items = [];
    load();
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.atLast()) {
      $scope.paginator.page += 1;
      load();
    }
  }
}]);
