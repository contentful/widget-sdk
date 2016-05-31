'use strict';

angular.module('contentful').factory('entitySelector', ['$injector', function ($injector) {

  var modalDialog = $injector.get('modalDialog');

  return {
    open: function (config) {
      return modalDialog.open({
        template: 'entity_selector_dialog',
        ignoreEsc: true,
        noNewScope: true,
        scopeData: {config: config}
      }).promise;
    }
  };
}])

.controller('EntitySelectorController', ['$injector', '$scope', function EntitySelectorController ($injector, $scope) {

  var spaceContext = $injector.get('spaceContext');
  var ListQuery = $injector.get('ListQuery');
  var Paginator = $injector.get('Paginator');
  var $timeout = $injector.get('$timeout');
  var createQueue = $injector.get('overridingRequestQueue');
  var $controller = $injector.get('$controller');

  var ORDER = {
    fieldId: 'updatedAt',
    direction: 'descending'
  };

  var LABELS = {
    entry_single: {
      title: 'Insert existing entry',
      placeholder: 'Search for an entry',
      info: 'You can insert only one entry. Click on any entry to insert it.'
    },
    entry_multiple: {
      title: 'Insert existing entries',
      placeholder: 'Search for entries',
      button: 'Insert selected entries'
    },
    asset_single: {
      title: 'Insert existing asset',
      placeholder: 'Search for an asset',
      info: 'You can insert only one asset. Click on any asset to insert it.'
    },
    asset_multiple: {
      title: 'Insert existing assets',
      placeholder: 'Search for assets',
      button: 'Insert selected assets'
    }
  };

  var MODES = {
    AVAILABLE: 1,
    SELECTED: 2
  };

  _.extend($scope, MODES, {
    labels: getLabels(),
    spaceContext: spaceContext,
    view: {mode: MODES.AVAILABLE},
    paginator: new Paginator(),
    items: [],
    selected: [],
    selectedIds: {},
    select: select,
    deselect: deselect,
    loadMore: loadMore,
    getStatusClassname: $controller('EntityStatusController', {$scope: $scope}).getClassname,
    isEntry: _.constant($scope.config.entityType === 'entry'),
    // @todo implement for a single CT
    getSearchContentType: _.constant(undefined)
  });

  var load = createQueue(function () {
    $scope.isLoading = true;
    return getQuery().then(executeQuery);
  }, function (resultPromise) {
    resultPromise.then(handleItems);
  });

  $scope.$watch('view.searchTerm', handleTermChange);
  $scope.$on('forceSearch', resetAndLoad);

  function getQuery () {
    var method = $scope.isEntry() ? 'getForEntries' : 'getForAssets';
    var params = {
      searchTerm: $scope.view.searchTerm,
      order: ORDER,
      paginator: $scope.paginator
    };

    return ListQuery[method](params);
  }

  function executeQuery (query) {
    var method = $scope.isEntry() ? 'getEntries' : 'getAssets';
    return spaceContext.space[method](query);
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

  function getLabels () {
    var c = $scope.config;
    var key = [c.entityType, (c.multiple ? 'multiple' : 'single')].join('_');
    return LABELS[key];
  }
}]);
