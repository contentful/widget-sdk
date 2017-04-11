'use strict';

/**
 * @ngdoc type
 * @name EntitySelectorController
 *
 * @scope.requires {Object} config
 * {
 *   locale: {String},
 *   multiple: {Boolean},
 *   max: {Number?}, // for multiple=true
 *   min: {Number?}, // for multiple=true
 *   entityType: {String},
 *   linksEntry: {Boolean}, // TODO: Remove
 *   linksAsset: {Boolean}, // TODO: Remove
 *   linkedContentTypeIds: {Array?},
 *   linkedMimetypeGroups: {Array?},
 *   fetch: {function(params): Promise<{items: {Array}, total: {Number}}>}
 * }
 * @scope.requires {object} labels
 * {
 *   title: {String},
 *   input: {String},
 *   info: {String?}, // for multiple=false
 *   selected: {String}, // for multiple=true
 *   empty: {String},
 *   insert: {String},
 *   searchPlaceholder: {String}
 * }
 * @scope.requires {number} listHeight
 * @scope.requires {ContentType?} singleContentType
 */
angular.module('contentful')
.controller('EntitySelectorController', ['require', '$scope', function EntitySelectorController (require, $scope) {

  var $timeout = require('$timeout');
  var spaceContext = require('spaceContext');
  var Paginator = require('Paginator');
  var createQueue = require('overridingRequestQueue');
  var EntityHelpers = require('EntityHelpers');

  var MIN_SEARCH_TRIGGERING_LEN = 1;
  var MODES = {AVAILABLE: 1, SELECTED: 2};

  var config = $scope.config;
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
    getSearchPlaceholder: getSearchPlaceholder,
    supportsAdvancedSearch: _.includes(['Entry', 'Asset'], config.entityType),
    helpers: EntityHelpers.newByType(config.entityType, config.locale)
  });

  $scope.$watch('view.searchTerm', handleTermChange);
  $scope.$on('forceSearch', resetAndLoad);

  resetAndLoad();

  function fetch () {
    $scope.isLoading = true;
    return config.fetch(getParams());
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

  // TODO: Move toggle logic into a service and improve edge cases.
  var lastToggled;
  function toggleSelection (entity, event) {
    if (!config.multiple) {
      $scope.dialog.confirm([entity]);
    } else {
      var action;
      if (event && event.shiftKey && lastToggled) {
        var from = $scope.items.indexOf(entity);
        var to = $scope.items.indexOf(lastToggled.entity);
        var first = Math.min(from, to);
        var last = Math.max(from, to) + 1;
        action = lastToggled.action;
        $scope.items.slice(first, last).forEach(toggle[action]);
        event.preventDefault();
        document.getSelection().removeAllRanges();
      } else {
        var toggleMethod = $scope.selectedIds[entity.sys.id] ? toggle.deselect : toggle.select;
        toggleMethod(entity);
      }
      lastToggled = { entity: entity, action: action };
    }
  }

  var toggle = {
    select: function select (entity) {

      var index = _.findIndex($scope.selected, ['sys.id', entity.sys.id]);

      if (index === -1) {
        $scope.selected.push(entity);
      }
      $scope.selectedIds[entity.sys.id] = true;
    },
    deselect: function deselect (entity) {
      var index = _.findIndex($scope.selected, ['sys.id', entity.sys.id]);
      if (index > -1) {
        $scope.selected.splice(index, 1);
      }
      delete $scope.selectedIds[entity.sys.id];
    }
  };

  function handleTermChange (term, prev) {
    if (isTermTriggering(term) || isClearingTerm(term, prev)) {
      resetAndLoad();
    }
  }

  function isTermTriggering (term) {
    return _.isString(term) && term.length >= MIN_SEARCH_TRIGGERING_LEN;
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
    // @TODO - does backend ever return duplicate items for any query?
    // If no, we should remove this
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

  function getSearchPlaceholder () {
    var placeholder = $scope.labels.searchPlaceholder;
    if (!placeholder) {
      return '';
    }
    var totalEntities = $scope.paginator.getTotal();
    placeholder = placeholder.replace(/%total%\s*/, totalEntities > 1 ? totalEntities + ' ' : '');
    if ($scope.supportsAdvancedSearch) {
      placeholder += ', press down arrow key for help';
    }
    return placeholder;
  }
}]);
