'use strict';

angular.module('contentful/controllers').controller('EntryListCtrl', function EntryListCtrl($scope, Paginator, Selection, cfSpinner) {
  $scope.contentType = 'entries';
  $scope.entrySection = 'all';

  $scope.paginator = new Paginator();
  $scope.selection = new Selection();

  $scope.editEntry = function(entry) {
    var editor = _.find($scope.tab.list.items, function(tab){
      return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
    });
    if (!editor) {
      editor = $scope.tab.list.add({
        viewType: 'entry-editor',
        section: 'entries',
        params: {
          entry: entry,
          mode: 'edit'
        },
        title: this.bucketContext.entryTitle(entry)
      });
    }
    editor.activate();
  };

  $scope.searchTerm = '';

  $scope.$on('entityDeleted', function (event, entity) {
    var scope = event.currentScope;
    var index = _.indexOf(scope.entries, entity);
    if (index > -1) {
      scope.entries.splice(index, 1);
    }
  });

  $scope.$watch('searchTerm', function(n,o, scope) {
    if (n === o) return;
    scope.paginator.page = 0;
    scope.resetEntries();
  });

  $scope.switchContentType = function(type){
    $scope.tab.params.contentType = type;
  };

  $scope.switchList = function(list){
    if ($scope.tab.params.list == list) {
      this.resetEntries();
    } else {
      this.paginator.page = 0;
      this.tab.params.list = list;
    }
  };

  $scope.switchEntryType = function(entryType){
    if ($scope.tab.params.entryTypeId == entryType) {
      this.resetEntries();
    } else {
      this.paginator.page = 0;
      if (entryType) {
        this.tab.params.entryTypeId = entryType.getId();
      } else {
        this.tab.params.entryTypeId = null;
      }
    }
  };

  $scope.visibleInCurrentList = function(entry){
    switch ($scope.tab.params.list) {
      case 'all':
        return !entry.isDeleted() && !entry.isArchived();
      case 'published':
        return entry.isPublished();
      case 'unpublished':
        return !entry.isPublished();
      case 'archived':
        return entry.isArchived();
      default:
        return true;
    }
  };

  $scope.$watch(function pageParameters(scope){
    return {
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      list: scope.tab.params.list,
      entryTypeId: scope.tab.params.entryTypeId,
      bucketId: (scope.bucketContext.bucket && scope.bucketContext.bucket.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetEntries();
  }, true);

  $scope.resetEntries = function() {
    if (this.reloadInProgress || this.resetPaused) return;
    var scope = this;

    this.reloadInProgress = true;
    var stopSpin = cfSpinner.start();
    this.bucketContext.bucket.getEntries(this.buildQuery(), function(err, entries, stats) {
      scope.reloadInProgress = false;
      if (err) return;
      scope.paginator.numEntries = stats.total;
      scope.selection.switchBaseSet(stats.total);
      scope.$apply(function(scope){
        scope.entries = entries;
        stopSpin();
      });
    });
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
      queryObject['sys.publishedAt[gt]'] = 0;
    } else if (this.tab.params.list == 'unpublished') {
      queryObject['sys.publishedAt'] = 0;
    } else if (this.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[gt]'] = 0;
    }

    if (this.tab.params.entryTypeId) {
      queryObject['sys.entryType.sys.id'] = this.tab.params.entryTypeId;
    }

    if (this.searchTerm && 0 < this.searchTerm.length) {
      queryObject.query = this.searchTerm;
    }

    return queryObject;
  };

  $scope.pauseReset = function() {
    if (this.resetPaused) return;
    var scope = this;
    this.resetPaused = true;
    setTimeout(function() {
      scope.resetPaused = false;
    }, 500);
  };

  $scope.loadMore = function() {
    if (this.reloadInProgress || this.resetPaused) return;
    if (this.paginator.atLast()) return;
    var scope = this;
    this.paginator.page++;
    this.pauseReset();
    var stopSpin = cfSpinner.start();
    this.bucketContext.bucket.getEntries(this.buildQuery(), function(err, entries, stats) {
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
    });
  };

  $scope.statusClass = function(entry){
    if (entry.isPublished()) {
      return 'published';
    } else if (entry.isArchived()) {
      return 'archived';
    } else {
      return 'draft';
    }
  };

  $scope.toggleEntrySelection = function() {};

  // Development shorcut to quickly open an entry

  //$scope.$watch(function($scope){
  //  return !(_.isEmpty($scope.entries) || _.isEmpty($scope.entryTypes));
  //}, function(dataReady){
  //  if (dataReady) {
  //    $scope.editEntry($scope.entries[0]);
  //  }
  //});

});
