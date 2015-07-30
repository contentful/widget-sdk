'use strict';

angular.module('contentful').controller('EntryListController', ['$scope', '$injector', function EntryListController($scope, $injector) {
  var $controller        = $injector.get('$controller');
  var $q                 = $injector.get('$q');
  var EntityListCache    = $injector.get('EntityListCache');
  var Paginator          = $injector.get('Paginator');
  var PromisedLoader     = $injector.get('PromisedLoader');
  var ReloadNotification = $injector.get('ReloadNotification');
  var Selection          = $injector.get('Selection');
  var analytics          = $injector.get('analytics');
  var modalDialog        = $injector.get('modalDialog');
  var searchQueryHelper  = $injector.get('searchQueryHelper');
  var logger             = $injector.get('logger');

  $controller('DisplayedFieldsController', {$scope: $scope});
  $controller('EntryListViewsController', {$scope: $scope});
  $scope.entityStatusController = $controller('EntityStatusController', {$scope: $scope});

  var ORDER_PREFIXES = {
    'descending': '-',
    'ascending': '',
  };

  var entryLoader = new PromisedLoader();

  $scope.entrySection = 'all';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

  $scope.entryCache = new EntityListCache({
    space: $scope.spaceContext.space,
    entityType: 'Entry',
    limit: 5
  });

  $scope.assetCache = new EntityListCache({
    space: $scope.spaceContext.space,
    entityType: 'Asset',
    limit: 3
  });

  $scope.showNewContentTypeDialog = function(){
    modalDialog.open({
      scope: $scope,
      template: 'new_content_type_list'
    });
  };

  $scope.getSearchContentType = function () {
    var id = $scope.context && $scope.context.view && $scope.context.view.contentTypeId;
    return $scope.spaceContext && $scope.spaceContext.getPublishedContentType && $scope.spaceContext.getPublishedContentType(id);
  };

  $scope.$on('entityDeleted', function (event, entity) {
    var scope = event.currentScope;
    var index = _.indexOf(scope.entries, entity);
    if (index > -1) {
      scope.entries.splice(index, 1);
    }
  });

  $scope.$watch('spaceContext.publishedContentTypes.length', function (count) {
    if(count === 1)
      $scope.singleContentType = $scope.spaceContext.publishedContentTypes[0];
    else
      $scope.singleContentType = null;
  }, true);

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm: scope.context.view.searchTerm,
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      contentTypeId: scope.context.view.contentTypeId,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
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
      var ct = $scope.spaceContext.getPublishedContentType(id);
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
    return $scope.spaceContext.displayFieldForType($scope.context.view.contentTypeId);
  };

  // TODO this code is duplicated in the asset list controller
  $scope.visibleInCurrentList = function(entry){
    // TODO: This needs to basically emulate the API :(
    return !entry.isDeleted();
  };

  $scope.resetEntries = function(resetPage) {
    if (resetPage) $scope.paginator.page = 0;
    return buildQuery()
    .then(function (query) {
      return entryLoader.loadPromise(function(){
        return $scope.spaceContext.space.getEntries(query);
      });
    })
    .then(function (entries) {
      $scope.paginator.numEntries = entries.total;
      $scope.entries = entries;
      $scope.selection.switchBaseSet($scope.entries.length);
      // Check if a refresh is necessary in cases where no pageParameters change
      refreshEntityCaches();
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  function refreshEntityCaches() {
    if($scope.context.view.contentTypeId){
      $scope.entryCache.setDisplayedFieldIds($scope.context.view.displayedFieldIds);
      $scope.entryCache.resolveLinkedEntities($scope.entries);
      $scope.assetCache.setDisplayedFieldIds($scope.context.view.displayedFieldIds);
      $scope.assetCache.resolveLinkedEntities($scope.entries);
    }
  }

  function getOrderQuery() {
    var path = $scope.context.view;
    return ORDER_PREFIXES[path.order.direction] + getFieldPath(path.order.fieldId);
  }

  function getFieldPath(fieldId) {
    /* jshint boss:true */
    var field;
    // Usually we use a system field for ordering
    if (field = findSysField(fieldId)) {
      return 'sys.'+fieldId;
    } else {
      // If the user has defined a custom field for ordering
      var contentType = $scope.spaceContext.getPublishedContentType($scope.context.view.contentTypeId);
      field = _.find(contentType.data.fields, {id: fieldId});
      if(field){
        var defaultLocale = $scope.spaceContext.space.getDefaultLocale().internal_code;
        return 'fields.'+apiNameOrId(field)+'.'+defaultLocale;
      } else {
        // In case the custom field saved in the view does not exist anymore
        var defaultFieldId = $scope.getDefaultOrderFieldId();
        field = findSysField(defaultFieldId);
        return 'sys.'+defaultFieldId;
      }
    }
  }

  function findSysField(fieldId) {
    return _.find($scope.systemFields, {id: fieldId});
  }

  function buildQuery() {
    var contentType;
    var queryObject = {
      order: getOrderQuery(),
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.context.view.contentTypeId) {
      contentType = $scope.spaceContext.getPublishedContentType($scope.context.view.contentTypeId);
    }

    return searchQueryHelper.buildQuery($scope.spaceContext.space, contentType, $scope.context.view.searchTerm)
    .then(function (searchQuery) {
      _.extend(queryObject, searchQuery);
      return queryObject;
    });
  }

  // TODO this code is duplicated in the asset list controller
  $scope.showNoEntriesAdvice = function () {
    var view = $scope.context.view;
    var hasQuery = !_.isEmpty(view.searchTerm) ||
                   !_.isEmpty(view.contentTypeId);
    var hasEntries = $scope.entries && $scope.entries.length > 0;
    return !hasEntries && !hasQuery;
  };

  // TODO this code is duplicated in the asset list controller
  $scope.showCreateEntryButton = function () {
    var hasContentTypes = !_.isEmpty($scope.spaceContext.publishedContentTypes);
    var hideCreateEntry = $scope.permissionController.get('createEntry', 'shouldHide');
    return hasContentTypes && !hideCreateEntry;
  };

  $scope.loadMore = function () {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    var queryForDebug;
    return buildQuery()
    .then(function (query) {
      analytics.track('Scrolled EntryList');
      queryForDebug = query;
      return entryLoader.loadPromise(function(){
        return $scope.spaceContext.space.getEntries(query);
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
      $scope.paginator.page--;
      return $q.reject(err);
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

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

  $scope.resetEntries();

  $scope.$on('templateWasCreated', function () {
    $scope.resetEntries();
  });

  function apiNameOrId(field) {
    if (field.apiName) {
      return field.apiName;
    } else {
      return field.id;
    }
  }
}]);
