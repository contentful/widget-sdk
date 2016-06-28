'use strict';

angular.module('contentful')
.controller('EntitySelectorController', ['$injector', '$scope', function EntitySelectorController ($injector, $scope) {

  var $timeout = $injector.get('$timeout');
  var spaceContext = $injector.get('spaceContext');
  var ListQuery = $injector.get('ListQuery');
  var Paginator = $injector.get('Paginator');
  var createQueue = $injector.get('overridingRequestQueue');
  var EntityHelpers = $injector.get('EntityHelpers');
  var createEntityStore = $injector.get('EntityStore').create;

  var MINIMAL_TRIGGERING_LEN = 4;
  var ORDER = {fieldId: 'updatedAt', direction: 'descending'};
  var MODES = {AVAILABLE: 1, SELECTED: 2};

  var config = $scope.config;
  var queryMethod = config.linksEntry ? 'getForEntries' : 'getForAssets';
  var fetchMethod = config.linksEntry ? 'getEntries' : 'getAssets';

  var store = createEntityStore();
  var selectedIds = {};

  var linksApi = _.extend({
    getEntity: store.get,
    toggleSelected: toggleSelected
  }, EntityHelpers.forLocale('en-US'));

  var load = createQueue(fetch, function (resultPromise) {
    resultPromise.then(handleResponse);
  });

  _.extend($scope, MODES, {
    spaceContext: spaceContext,
    view: {mode: MODES.AVAILABLE},
    paginator: new Paginator(),
    links: [],
    selected: [],
    loadMore: loadMore,
    linksApi: linksApi
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
      order: ORDER,
      paginator: $scope.paginator
    };

    if (config.linksEntry && $scope.singleContentType) {
      params.contentTypeId = $scope.singleContentType.getId();
    }

    return params;
  }

  function toggleSelected (link) {
    var entity = store.get(link);
    if (!config.multiple) {
      $scope.dialog.confirm([entity]);
    } else if (!selectedIds[entity.sys.id]) {
      $scope.selected.push(entity);
      selectedIds[entity.sys.id] = true;
    } else {
      deselect(entity);
    }
  }

  function deselect (entity) {
    delete selectedIds[entity.sys.id];
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
    _.forEach(res.items, store.add);
    $scope.paginator.numEntries = res.total;
    $scope.links.push.apply($scope.links, res.items);

    $timeout(function () {
      $scope.isLoading = false;
    });
  }

  function resetAndLoad () {
    $scope.links = [];
    $scope.paginator.numEntries = 0;
    $scope.paginator.page = 0;
    store.reset();
    load();
  }

  function loadMore () {
    if (!$scope.isLoading && !$scope.paginator.atLast()) {
      $scope.paginator.page += 1;
      load();
    }
  }
}]);
