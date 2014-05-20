'use strict';

angular.module('contentful').controller('EntryListCtrl',
  function EntryListCtrl($scope, $controller, Paginator, Selection, analytics, PromisedLoader, sentry, searchQueryHelper, EntityCache) {

  $controller('DisplayedFieldsController', {$scope: $scope});
  $controller('EntryListViewsController', {$scope: $scope});

  var ORDER_PREFIXES = {
    'descending': '-',
    'ascending': '',
  };

  var entryLoader = new PromisedLoader();

  $scope.entrySection = 'all';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

  $scope.entryCache = new EntityCache({
    space: $scope.spaceContext.space,
    entityType: 'Entry',
    limit: 5
  });

  $scope.assetCache = new EntityCache({
    space: $scope.spaceContext.space,
    entityType: 'Asset',
    limit: 3
  });

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
      searchTerm: scope.tab.params.preset.searchTerm,
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      contentTypeId: scope.tab.params.preset.contentTypeId,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetEntries(pageParameters.page === old.page);
  }, true);

  $scope.$watch(function cacheParameters(scope){
    return {
      contentTypeId: scope.tab.params.preset.contentTypeId,
      displayedFieldIds: scope.tab.params.preset.displayedFieldIds,
      entriesLength: scope.entries && scope.entries.length,
      page: scope.paginator.page
    };
  }, refreshEntityCaches, true);

  $scope.typeNameOr = function (or) {
    try {
      return $scope.tab.params.preset.contentTypeId ?
        $scope.spaceContext.getPublishedContentType($scope.tab.params.preset.contentTypeId).getName() : or;
    } catch (e) {
      sentry.captureException(e, {extra: {contentTypeId: $scope.tab.params.preset.contentTypeId}});
      return or;
    }
  };

  $scope.selectedContentType = function () {
    $scope.tab.params.preset.searchTerm = null;
    $scope.resetDisplayFields();
  };

  $scope.visibleInCurrentList = function(){
    // TODO: This needs to basically emulate the API :(
    return true;
  };

  $scope.resetEntries = function(resetPage) {
    if (resetPage) $scope.paginator.page = 0;
    return buildQuery()
    .then(function (query) {
      return entryLoader.load($scope.spaceContext.space, 'getEntries', query);
    })
    .then(function (entries) {
      $scope.paginator.numEntries = entries.total;
      $scope.entries = entries;
      $scope.selection.switchBaseSet($scope.entries.length);
    });
  };

  function refreshEntityCaches() {
    if($scope.tab.params.preset.contentTypeId){
      $scope.entryCache.setDisplayedFieldIds($scope.tab.params.preset.displayedFieldIds);
      $scope.entryCache.resolveLinkedEntities($scope.entries);
      $scope.assetCache.setDisplayedFieldIds($scope.tab.params.preset.displayedFieldIds);
      $scope.assetCache.resolveLinkedEntities($scope.entries);
    }
  }

  function getOrderQuery() {
    var p = $scope.tab.params.preset;
    return ORDER_PREFIXES[p.order.direction] + getFieldPath(p.order.fieldId);

    function getFieldPath(fieldId) {
      if (_.find($scope.systemFields, {id: fieldId})) {
        return 'sys.'+fieldId;
      } else {
        var defaultLocale = $scope.spaceContext.space.getDefaultLocale().code;
        return 'fields.'+fieldId+'.'+defaultLocale;
      }
    }
  }

  function buildQuery() {
    var contentType;
    var queryObject = {
      order: getOrderQuery(),
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.tab.params.preset.contentTypeId) {
      contentType = $scope.spaceContext.getPublishedContentType($scope.tab.params.preset.contentTypeId);
    }

    return searchQueryHelper.buildQuery($scope.spaceContext.space, contentType, $scope.tab.params.preset.searchTerm)
    .then(function (searchQuery) {
      _.extend(queryObject, searchQuery);
      return queryObject;
    });
  }

  $scope.hasQuery = function () {
    return !_.isEmpty($scope.tab.params.preset.searchTerm);
  };

  $scope.loadMore = function() {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    var queryForDebug;
    return buildQuery()
    .then(function (query) {
      analytics.track('Scrolled EntryList');
      queryForDebug = query;
      return entryLoader.load($scope.spaceContext.space, 'getEntries', query);
    })
    .then(function (entries) {
      if(!entries){
        sentry.captureError('Failed to load more entries', {
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
    }, function () {
      $scope.paginator.page--;
    });
  };

  $scope.statusClass = function(entry){
    if (entry.isPublished()) {
      if (entry.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'published';
      }
    } else if (entry.isArchived()) {
      return 'archived';
    } else {
      return 'draft';
    }
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

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.resetEntries();
  });
});
