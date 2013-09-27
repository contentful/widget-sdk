'use strict';

angular.module('contentful').controller('EntryListCtrl', function EntryListCtrl($scope, $q, Paginator, Selection, analytics, PromisedLoader) {
  var entryLoader = new PromisedLoader();

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

  $scope.$watch('searchTerm',  function (term) {
    if (term === null) return;
    $scope.tab.params.list = 'all';
    $scope.tab.params.contentTypeId = null;
    $scope.paginator.page = 0;
    $scope.resetEntries();
  });

  $scope.switchList = function(list, contentType){
    $scope.searchTerm = null;
    var params = $scope.tab.params;
    var shouldReset =
      params.list == list &&
      (!contentType || params.contentTypeId == contentType.getId());

    if (shouldReset) {
      this.resetEntries();
    } else {
      this.paginator.page = 0;
      params.contentTypeId = contentType ? contentType.getId() : null;
      params.list = list;
    }
  };

  $scope.visibleInCurrentList = function(entry){
    switch ($scope.tab.params.list) {
      case 'all':
        return !entry.isDeleted() && !entry.isArchived();
      case 'published':
        return entry.isPublished();
      case 'changed':
        return entry.hasUnpublishedChanges();
      case 'archived':
        return entry.isArchived();
      default:
        return true;
    }
  };

  // TODO doesn't this make some of the resetEntries calls unnecessary?
  $scope.$watch(function pageParameters(scope){
    return {
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      list: scope.tab.params.list,
      contentTypeId: scope.tab.params.contentTypeId,
      spaceId: (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetEntries();
  }, true);

  $scope.resetEntries = function() {
    return entryLoader.load($scope.spaceContext.space, 'getEntries', buildQuery()).
    then(function (entries) {
      $scope.paginator.numEntries = entries.total;
      $scope.entries = entries;
      $scope.selection.switchBaseSet($scope.entries.length);
      analytics.track('Reloaded EntryList');
    });
  };

  function buildQuery() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.tab.params.list == 'all') {
      queryObject['sys.archivedAt[exists]'] = 'false';
    } else if ($scope.tab.params.list == 'published') {
      queryObject['sys.publishedAt[exists]'] = 'true';
    } else if ($scope.tab.params.list == 'changed') {
      queryObject['sys.archivedAt[exists]'] = 'false';
      queryObject['changed'] = 'true';
    } else if ($scope.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[exists]'] = 'true';
    } else if ($scope.tab.params.list == 'contentType') {
      queryObject['sys.contentType.sys.id'] = $scope.tab.params.contentTypeId;
    }

    if (!_.isEmpty($scope.searchTerm)) {
      queryObject.query = $scope.searchTerm;
    }

    return queryObject;
  }

  $scope.hasQuery = function () {
    var noQuery = $scope.tab.params.list == 'all' && _.isEmpty($scope.searchTerm);
    return !noQuery;
  };

  $scope.loadMore = function() {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    entryLoader.load($scope.spaceContext.space, 'getEntries', buildQuery()).
    then(function (entries) {
      $scope.paginator.numEntries = entries.total;
      $scope.entries.push.apply($scope.entries, entries);
      $scope.selection.setBaseSize($scope.entries.length);
    }, function () {
      $scope.paginator.page--;
    });

    analytics.track('Scrolled EntryList');
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

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.resetEntries();
  });
});
