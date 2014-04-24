'use strict';

angular.module('contentful').controller('EntryListCtrl',
  function EntryListCtrl($scope, Paginator, Selection, analytics, PromisedLoader, sentry, searchQueryHelper) {

  var DEFAULT_ORDER_QUERY = 'sys.updatedAt';
  var DEFAULT_ORDER_DIRECTION = 'descendant';
  var ORDER_PREFIXES = {
    'descendant': '-',
    'ascendant': '',
  };

  var SORTABLE_TYPES = [
    'Boolean',
    'Date',
    'Integer',
    'Number',
    'Symbol',
    'Location'
  ];

  $scope.orderQuery = DEFAULT_ORDER_QUERY;
  $scope.orderDirection = DEFAULT_ORDER_DIRECTION;
  $scope.orderField = 'updatedAt';

  var entryLoader = new PromisedLoader();

  $scope.systemFields = [
    {
      id: 'updatedAt',
      name: 'Updated',
      type: 'Date',
      sys: true,
      persistent: true
    },
    {
      id: 'author',
      name: 'Author',
      type: 'Symbol',
      sys: true
    }
  ];

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type);
  };

  $scope.filteredContentType = null;
  $scope.filteredContentTypeFields = [];
  $scope.displayedFields = _.clone($scope.systemFields);

  $scope.entrySection = 'all';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

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
      searchTerm: scope.searchTerm,
      pageLength: scope.paginator.pageLength,
      contentTypeId: scope.tab.params.contentTypeId,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetEntries();
  }, true);

  $scope.typeNameOr = function (or) {
    return $scope.tab.params.contentTypeId ?
      $scope.spaceContext.getPublishedContentType($scope.tab.params.contentTypeId).getName() : or;
  };

  function getFilteredContentType(contentTypeId) {
    return _.filter($scope.spaceContext.publishedContentTypes, function (ct) {
      return ct.getId() === contentTypeId;
    })[0];
  }

  $scope.filterByContentType = function (contentType) {
    $scope.searchTerm = null;
    this.paginator.page = 0;
    var params = $scope.tab.params;
    params.contentTypeId = contentType ? contentType.getId() : null;
    $scope.filteredContentType = contentType ? getFilteredContentType(params.contentTypeId) : null;
    $scope.filteredContentTypeFields = contentType ? contentType.data.fields : [];
  };

  $scope.visibleInCurrentList = function(){
    // TODO: This needs to basically emulate the API :(
    return true;
  };

  $scope.resetEntries = function() {
    $scope.paginator.page = 0;
    return buildQuery()
    .then(function (query) {
      return entryLoader.load($scope.spaceContext.space, 'getEntries', query);
    })
    .then(function (entries) {
      $scope.paginator.numEntries = entries.total;
      $scope.entries = entries;
      $scope.selection.switchBaseSet($scope.entries.length);
      analytics.track('Reloaded EntryList');
    });
  };

  $scope.setOrderField = function (field) {
    var fieldPath = $scope.getFieldPath(field);
    $scope.orderDirection = DEFAULT_ORDER_DIRECTION;
    $scope.orderQuery = fieldPath;
    $scope.orderField = field.id;
    $scope.resetEntries();
  };

  $scope.orderColumnBy = function () {
    $scope.orderDirection = switchOrderDirection($scope.orderDirection);
    $scope.resetEntries();
  };

  function getOrderDirection() {
    return ORDER_PREFIXES[$scope.orderDirection];
  }

  function switchOrderDirection(direction) {
    return {
      'ascendant': 'descendant',
      'descendant': 'ascendant'
    }[direction];
  }

  function getOrderQuery() {
    return getOrderDirection() + $scope.orderQuery;
  }

  function buildQuery() {
    var contentType;
    var queryObject = {
      order: getOrderQuery(),
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.tab.params.contentTypeId) {
      contentType = $scope.spaceContext.getPublishedContentType($scope.tab.params.contentTypeId);
    }

    var searchQuery = searchQueryHelper.buildQuery(contentType, $scope.searchTerm);

    _.extend(queryObject, searchQuery);

    return queryObject;
  }

  $scope.hasQuery = function () {
    return !_.isEmpty($scope.searchTerm);
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

  $scope.getFieldClass = function (field) {
    return 'cell-'+field.type.toLowerCase();
  };

  $scope.getFieldPath = function (field) {
    if(field.sys){
      return 'sys.'+field.id;
    }
    var defaultLocale = $scope.spaceContext.space.getDefaultLocale().code;
    return 'fields.'+field.id+'.'+defaultLocale;
  };

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.resetEntries();
  });
});
