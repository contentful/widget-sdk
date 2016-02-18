'use strict';

angular.module('contentful')
/**
 * @ngdoc type
 * @name EntryListController
 */
.controller('EntryListController', ['$scope', '$injector', function EntryListController($scope, $injector) {
  var $controller           = $injector.get('$controller');
  var $q                    = $injector.get('$q');
  var EntityListCache       = $injector.get('EntityListCache');
  var Paginator             = $injector.get('Paginator');
  var PromisedLoader        = $injector.get('PromisedLoader');
  var ReloadNotification    = $injector.get('ReloadNotification');
  var Selection             = $injector.get('Selection');
  var analytics             = $injector.get('analytics');
  var ListQuery             = $injector.get('ListQuery');
  var logger                = $injector.get('logger');
  var spaceContext          = $injector.get('spaceContext');
  var accessChecker         = $injector.get('accessChecker');

  $controller('DisplayedFieldsController', {$scope: $scope});
  $controller('EntryListViewsController', {$scope: $scope});
  $scope.entityStatusController = $controller('EntityStatusController', {$scope: $scope});

  var entryLoader = new PromisedLoader();

  $scope.archivedStateRef = 'spaces.detail.entries.list({searchTerm: "status:archived"})';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

  $scope.entryCache = new EntityListCache({
    space: spaceContext.space,
    entityType: 'Entry',
    limit: 5
  });

  $scope.assetCache = new EntityListCache({
    space: spaceContext.space,
    entityType: 'Asset',
    limit: 3
  });

  $scope.getSearchContentType = function () {
    var id = dotty.get($scope, 'context.view.contentTypeId');
    return spaceContext.getPublishedContentType(id);
  };

  $scope.$on('entityDeleted', function (event, entity) {
    var scope = event.currentScope;
    var index = _.indexOf(scope.entries, entity);
    if (index > -1) {
      scope.entries.splice(index, 1);
    }
  });

  $scope.$watchCollection(function () {
    return {
      cts: spaceContext.publishedContentTypes,
      responses: accessChecker.getResponses()
    };
  }, function () {
    $scope.accessibleCts = _.filter(spaceContext.publishedContentTypes || [], function (ct) {
      return accessChecker.canPerformActionOnEntryOfType('create', ct.getId());
    });
  });

  $scope.$watch(function pageParameters(){
    return {
      searchTerm: $scope.context.view.searchTerm,
      page: $scope.paginator.page,
      pageLength: $scope.paginator.pageLength,
      contentTypeId: $scope.context.view.contentTypeId,
      spaceId: spaceContext.getId()
    };
  }, function(pageParameters, old, scope){
    scope.resetEntries(pageParameters.page === old.page);
  }, true);

  $scope.$watch(function cacheParameters(scope){
    return {
      contentTypeId: scope.context.view.contentTypeId,
      displayedFieldIds: scope.context.view.displayedFieldIds,
      entriesLength: scope.entries && scope.entries.length,
      page: scope.paginator.page,
      orderDirection: scope.context.view.order.direction,
      orderFieldId: scope.context.view.order.fieldId
    };
  }, refreshEntityCaches, true);

  $scope.typeNameOr = function (or) {
    try {
      var id = dotty.get($scope, 'context.view.contentTypeId');
      if (!id) return or;
      var ct = spaceContext.getPublishedContentType(id);
      if (!ct) return or;
      return ct.getName();
    } catch (e) {
      logger.logException(e, {data: {contentTypeId: id}});
      return or;
    }
  };

  $scope.selectedContentType = function () {
    $scope.context.view.searchTerm = null;
    $scope.resetDisplayFields();
  };

  $scope.displayFieldForFilteredContentType = function () {
    return spaceContext.displayFieldForType($scope.context.view.contentTypeId);
  };

  // TODO this code is duplicated in the asset list controller
  $scope.visibleInCurrentList = function(entry){
    // TODO: This needs to basically emulate the API :(
    return !entry.isDeleted();
  };

  $scope.resetEntries = function (resetPage) {
    $scope.context.loading = true;
    if (resetPage) { $scope.paginator.page = 0; }

    return prepareQuery()
    .then(function (query) {
      return entryLoader.loadPromise(function(){
        return spaceContext.space.getEntries(query);
      });
    })
    .then(handleEntriesResponse, accessChecker.wasForbidden($scope.context))
    .catch(ReloadNotification.apiErrorHandler);
  };

  function handleEntriesResponse(entries) {
    $scope.context.ready = true;
    $scope.context.loading = false;
    $scope.paginator.numEntries = entries.total;
    $scope.entries = entries;
    $scope.selection.switchBaseSet($scope.entries.length);
    // Check if a refresh is necessary in cases where no pageParameters change
    refreshEntityCaches();
  }

  function refreshEntityCaches() {
    if($scope.context.view.contentTypeId){
      $scope.entryCache.setDisplayedFieldIds($scope.context.view.displayedFieldIds);
      $scope.entryCache.resolveLinkedEntities($scope.entries);
      $scope.assetCache.setDisplayedFieldIds($scope.context.view.displayedFieldIds);
      $scope.assetCache.resolveLinkedEntities($scope.entries);
    }
  }

  /**
   * @ngdoc method
   * @name EntryListController#$scope.showNoEntriesAdvice
   * @description
   * Returns true if there are no items to be rendered, the user
   * specified no query, and the items are not loading.
   *
   * TODO this code is duplicated in the asset list controller
   *
   * @return {boolean}
   */
  $scope.showNoEntriesAdvice = function () {
    var view = $scope.context.view;
    var hasQuery = !_.isEmpty(view.searchTerm) ||
                   !_.isEmpty(view.contentTypeId);
    var hasEntries = $scope.entries && $scope.entries.length > 0;
    return !hasEntries && !hasQuery && !$scope.context.loading;
  };

  /**
   * @ngdoc property
   * @name EntryListController#$scope.hasArchivedEntries
   * @description
   * Value is true if we get archived entries from the API. The value
   * is updated whenever `showNoEntriesAdvice()` changes to `true`.
   *
   * TODO this code is duplicated in the asset list controller
   *
   * @type {boolean}
   */
  $scope.$watch('showNoEntriesAdvice()', function (show) {
    if (show) {
      $scope.hasArchivedEntries = false;
      return hasArchivedEntries(spaceContext.space)
      .then(function (hasArchived) {
        $scope.hasArchivedEntries = hasArchived;
      });
    }
  });

  // TODO this code is duplicated in the asset list controller
  function hasArchivedEntries (space) {
    return space.getEntries({
      'limit': 1,
      'sys.archivedAt[exists]': true
    }).then(function (response) {
      return response && response.total > 0;
    });
  }

  $scope.loadMore = function () {
    if ($scope.paginator.atLast()) return;
    // FIXME It should suffice to just increase the page and not fetch
    // the entries: Changing `$scope.paginator.page` will trigger the
    // `resetEntries` watcher and thus do the heavy lifting.
    $scope.paginator.page++;
    var queryForDebug;
    return prepareQuery()
    .then(function (query) {
      analytics.track('Scrolled EntryList');
      queryForDebug = query;
      return entryLoader.loadPromise(function(){
        return spaceContext.space.getEntries(query);
      });
    })
    .then(function (entries) {
      if(!entries){
        logger.logError('Failed to load more entries', {
          data: {
            entries: entries,
            query: queryForDebug
          }
        });
        return;
      }
      $scope.paginator.numEntries = entries.total;
      entries = _.difference(entries, $scope.entries);
      $scope.entries.push.apply($scope.entries, entries);
      $scope.selection.setBaseSize($scope.entries.length);
    }, function (err) {
      // TODO not needed since we crash the app anyway
      $scope.paginator.page--;
      return $q.reject(err);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  function prepareQuery() {
    var view = $scope.context.view;

    return ListQuery.getForEntries({
      contentTypeId: view.contentTypeId,
      order:         view.order,
      searchTerm:    view.searchTerm,
      paginator:     $scope.paginator
    });
  }

  var narrowFieldTypes = [
    'integer',
    'number',
    'boolean'
  ];

  var mediumFieldTypes = [
    'text',
    'symbol',
    'location',
    'date',
    'array',
    'link'
  ];

  $scope.getFieldClass = function (field) {
    var type = field.type.toLowerCase();
    var sizeClass = ' ';
    if(_.contains(narrowFieldTypes, type)) sizeClass += 'narrow';
    else if(_.contains(mediumFieldTypes, type)) sizeClass += 'medium';
    return 'cell-'+ type +sizeClass;
  };

  $scope.$on('templateWasCreated', function () {
    $scope.resetEntries();
  });
}]);
