'use strict';

angular.module('contentful').controller('EntryListCtrl', function EntryListCtrl($scope, Paginator, Selection, cfSpinner, analytics) {
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
    if (this.reloadInProgress || this.resetPaused) return;
    var scope = this;

    this.reloadInProgress = true;
    var stopSpin = cfSpinner.start();
    this.spaceContext.space.getEntries(this.buildQuery(), function(err, entries, stats) {
      scope.$apply(function(scope){
        scope.reloadInProgress = false;
        if (err) return;
        scope.paginator.numEntries = stats.total;
        scope.selection.switchBaseSet(stats.total);
        scope.entries = entries;
        stopSpin();
      });
    });
    analytics.track('Reloaded EntryList');
  };

  $scope.buildQuery = function() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: this.paginator.pageLength,
      skip: this.paginator.skipItems()
    };

    if (this.tab.params.list == 'all') {
      // do nothing
    } else if (this.tab.params.list == 'published') {
      queryObject['sys.publishedAt[exists]'] = 'true';
    } else if (this.tab.params.list == 'changed') {
      queryObject['sys.archivedAt[exists]'] = 'false';
      queryObject['changed'] = 'true';
    } else if (this.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[exists]'] = 'true';
    } else if (this.tab.params.list == 'contentType') {
      queryObject['sys.contentType.sys.id'] = this.tab.params.contentTypeId;
    }

    if (!_.isEmpty(this.searchTerm)) {
      queryObject.query = this.searchTerm;
    }

    return queryObject;
  };

  $scope.hasQuery = function () {
    var noQuery = $scope.tab.params.list == 'all' && _.isEmpty($scope.searchTerm);
    return !noQuery;
  };

  $scope.pauseReset = function() {
    if (this.resetPaused) return;
    var scope = this;
    this.resetPaused = true;
    setTimeout(function() {
      scope.resetPaused = false;
    }, 500);
  };

  // TODO unify the behavior between loadMore and resetEntries.
  // Try to get rid of pausereset
  // This is also used in cfAutocompleteResultList
  $scope.loadMore = function() {
    if (this.reloadInProgress || this.resetPaused) return;
    if (this.paginator.atLast()) return;
    var scope = this;
    this.paginator.page++;
    this.pauseReset();
    var stopSpin = cfSpinner.start();
    this.spaceContext.space.getEntries(this.buildQuery(), function(err, entries, stats) {
      scope.reloadInProgress = false;
      if (err) {
        scope.paginator.page--;
        stopSpin();
        return;
      }
      scope.paginator.numEntries = stats.total;
      scope.selection.switchBaseSet(stats.total);
      scope.$apply(function(scope){
        var args = [scope.entries.length, 0].concat(entries);
        scope.entries.splice.apply(scope.entries, args);
        stopSpin();
      });
    });

    scope.$apply(function(scope) {
      scope.reloadInProgress = true;
      analytics.track('Scrolled EntryList');
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

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.resetEntries();
  });
});
