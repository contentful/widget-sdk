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
 *   linkedContentTypeIds: {Array?},
 *   linkedMimetypeGroups: {Array?},
 *   fetch: {function(params): Promise<{items: {Array}, total: {Number}}>}
 * }
 * @scope.requires {object} labels
 * {
 *   title: {String},
 *   input: {String},
 *   info: {String?}, // for multiple=false
 *   infoHtml: {String?}, // for multiple=false, can be used instead of `.info`
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
  var K = require('utils/kefir');
  var Kefir = require('kefir');
  var _ = require('lodash');
  var createSearchInput = require('app/ContentList/Search').default;
  var getAccessibleCTs = require('data/ContentTypeRepo/accessibleCTs').default;

  var MIN_SEARCH_TRIGGERING_LEN = 1;
  var MODES = {AVAILABLE: 1, SELECTED: 2};

  var config = $scope.config;

  initializeSearchUI();

  var load = createQueue(fetch);

  // Returns a promise for the content type of the given entry.
  // We cache this by the entry id
  var getContentType = _.memoize(function (entity) {
    return spaceContext.publishedCTs.fetch(entity.sys.contentType.sys.id);
  }, function (entity) {
    return entity.sys.id;
  });

  _.assign($scope, MODES, {
    spaceContext: spaceContext,
    view: {mode: MODES.AVAILABLE},
    paginator: Paginator.create(),
    items: [],
    selected: [],
    selectedIds: {},
    toggleSelection: toggleSelection,
    loadMore: loadMore,
    getSearchPlaceholder: getSearchPlaceholder,
    showCustomEmptyMessage: showCustomEmptyMessage,
    supportsAdvancedSearch: _.includes(['Entry', 'Asset'], config.entityType),
    helpers: getEntityHelpers(config),
    getContentType: getContentType
  });

  $scope.$watch('view.searchTerm', handleTermChange);
  $scope.$on('forceSearch', resetAndLoad);

  resetAndLoad();

  function getEntityHelpers (config) {
    if (['Entry', 'Asset'].indexOf(config.entityType) < 0) {
      return null;
    } else {
      return EntityHelpers.newForLocale(config.locale);
    }
  }

  function initializeSearchUI () {
    var withAssets = config.entityType === 'Asset';
    var initialSearchState = {};
    if ($scope.singleContentType) {
      initialSearchState.contentTypeId = $scope.singleContentType.getId();
    }
    var isSearching$ = K.fromScopeValue($scope, function ($scope) {
      return $scope.isLoading && !$scope.isLoadingMore;
    });
    var accessibleContentType = getAccessibleCTs(spaceContext.publishedCTs, initialSearchState.contentTypeId);
    var contentTypes = getValidContentTypes($scope.config.linkedContentTypeIds, accessibleContentType);

    createSearchInput({
      $scope: $scope,
      contentTypes: contentTypes,
      onSearchChange: onSearchChange,
      isSearching$: isSearching$,
      initState: initialSearchState,
      users$: Kefir.fromPromise(spaceContext.users.getAll()),
      withAssets: withAssets
    });

    function getValidContentTypes (linkedContentTypeIds, contentTypes) {
      var acceptsOnlySpecificContentType = linkedContentTypeIds && linkedContentTypeIds.length > 0;

      if (acceptsOnlySpecificContentType) {
        contentTypes = contentTypes.filter(function (ct) {
          return linkedContentTypeIds.indexOf(ct.sys.id) > -1;
        });
      }

      return contentTypes;
    }
  }

  function onSearchChange (newSearchState) {
    _.assign($scope.view, newSearchState);
    resetAndLoad();
  }

  function fetch () {
    $scope.isLoading = true;
    return config.fetch(getParams());
  }

  function getParams () {
    var params = {
      order: getOrder(),
      paginator: $scope.paginator
    };
    _.assign(params, getSearch());

    if (config.entityType === 'Entry' && $scope.singleContentType) {
      params.contentTypeId = $scope.singleContentType.getId();
    }

    return params;
  }

  function getSearch () {
    var view = $scope.view || {};
    return {
      searchText: view.searchText || '',
      searchFilters: view.searchFilters || [],
      contentTypeId: view.contentTypeId
    };
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

  // @TODO: Move toggle logic into a service and improve edge cases.
  var lastToggled;
  function toggleSelection (entity, event) {
    if (!config.multiple) {
      $scope.dialog.confirm([entity]);
    } else {
      var toggleMethod;
      if (event && event.shiftKey && lastToggled) {
        var from = $scope.items.indexOf(entity);
        var to = $scope.items.indexOf(lastToggled.entity);
        var first = Math.min(from, to);
        var last = Math.max(from, to) + 1;
        toggleMethod = lastToggled.toggleMethod;
        $scope.items.slice(first, last).forEach(toggleMethod);
        event.preventDefault();
        document.getSelection().removeAllRanges();
      } else {
        toggleMethod = $scope.selectedIds[entity.sys.id] ? toggle.deselect : toggle.select;
        toggleMethod(entity);
      }
      lastToggled = { entity: entity, toggleMethod: toggleMethod };
    }
  }

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
      $scope.isLoadingMore = false;
    });
  }

  function getItemsToAdd (res) {
    // The api could theoretically return some of the entities returned already
    // if new entities were created in the meantime.
    var acc = {
      items: [],
      itemsById: _.groupBy($scope.items, 'sys.id')
    };

    return res.items.reduce(function (acc, item) {
      var id = _.get(item, 'sys.id');
      if (id && !acc.itemsById[id] && !isAssetWithoutFile(item)) {
        return {
          items: acc.items.concat(item),
          itemsById: Object.assign(acc.itemsById, _.set({}, id, item))
        };
      }
      return acc;
    }, acc).items;
  }

  function isAssetWithoutFile (item) {
    return _.get(item, 'sys.type') === 'Asset' && !_.get(item, 'fields.file');
  }

  function resetAndLoad () {
    $scope.isLoading = true;
    load().then(function (response) {
      $scope.items = [];
      $scope.paginator.setTotal(0);
      $scope.paginator.setPage(0);
      handleResponse(response);
    });
  }

  function loadMore () {
    // we can specify in the config that loading more is not needed
    // for example, if we fetch everything during the first call
    if (!$scope.config.noPagination &&
        !$scope.isLoading &&
        !$scope.paginator.isAtLast()) {
      $scope.isLoadingMore = true;
      $scope.paginator.next();
      load().then(handleResponse);
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

  function showCustomEmptyMessage () {
    return $scope.labels.noEntitiesCustomHtml && !$scope.isLoading && $scope.items.length < 1;
  }
}]);
