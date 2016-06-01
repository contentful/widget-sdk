'use strict';

angular.module('contentful').factory('entitySelector', ['$injector', function ($injector) {

  var modalDialog = $injector.get('modalDialog');
  var spaceContext = $injector.get('spaceContext');
  var $q = $injector.get('$q');
  var searchQueryHelper = $injector.get('searchQueryHelper');

  return {open: open};

  function open (config) {
    processValidations(config);

    return getSingleContentType(config)
    .then(openDialog);

    function openDialog (singleContentType) {
      return modalDialog.open({
        template: 'entity_selector_dialog',
        ignoreEsc: true,
        noNewScope: true,
        scopeData: {
          config: config,
          singleContentType: singleContentType
        }
      }).promise;
    }
  }

  function processValidations (c) {
    var size = findValidation(c, 'validations', 'size', {});
    c.min = _.isNumber(c.min) ? c.min : (size.min || 0);
    c.max = _.isNumber(c.max) ? c.max : (size.max || +Infinity);
    c.multiple = c.max < 2 ? false : c.multiple;

    c.linkedContentTypeIds = findValidation(c, 'items.validations', 'linkContentType', []);
  }

  function findValidation (config, path, property, defaultValue) {
    var validations = dotty.get(config, ['field', path].join('.'), []);
    var found = _.find(validations, function (v) {
      return _.isObject(v[property]);
    });

    return (found && found[property]) || defaultValue;
  }

  function getSingleContentType (config) {
    if (config.entityType === 'asset') {
      return $q.resolve(searchQueryHelper.assetContentType);
    }

    var linked = config.linkedContentTypeIds;
    if (linked.length === 1) {
      return spaceContext.fetchPublishedContentType(linked[0]);
    } else {
      return $q.resolve(null);
    }
  }
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
    isEntry: _.constant($scope.config.entityType === 'entry')
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
    var params = {
      searchTerm: $scope.view.searchTerm,
      order: ORDER,
      paginator: $scope.paginator
    };

    var method = $scope.isEntry() ? 'getForEntries' : 'getForAssets';
    var extension = {};

    if ($scope.isEntry()) {
      if ($scope.singleContentType) {
        params.contentType = $scope.singleContentType;
      } else if ($scope.config.linkedContentTypeIds.length > 1) {
        extension['sys.contentType.sys.id[in]'] = $scope.config.linkedContentTypeIds.join(',');
      }
    }

    return ListQuery[method](params)
    .then(function (query) {
      return _.extend(query, extension);
    });
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
