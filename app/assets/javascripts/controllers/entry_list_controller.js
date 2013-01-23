/*global Paginator:false*/
'use strict';

angular.module('contentful/controllers').controller('EntryListCtrl', function EntryListCtrl($scope) {
  $scope.contentType = 'entries';
  $scope.entrySection = 'all';

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

  $scope.deleteEntry = function (entry) {
    var scope = this;
    entry.delete(function (err) {
      if (!err) {
        scope.$apply(function() {}); // Trigger list filtering
      } else {
        console.log('Error deleting entry', entry);
      }
    });
  };

  $scope.archiveEntry = function (entry) {
    var scope = this;
    entry.archive(function (err) {
      if (!err) {
        scope.$apply(function() {}); // Trigger list filtering
      } else {
        console.log('Error archiving entry', entry);
      }
    });
  };

  $scope.unarchiveEntry = function (entry) {
    var scope = this;
    entry.unarchive(function (err) {
      if (!err) {
        scope.$apply(function() {}); // Trigger list filtering
      } else {
        console.log('Error unarchiving entry', entry);
      }
    });
  };

  
  $scope.search = {term: ''};

  $scope.$watch('search.term', function(n,o, scope) {
    if (n !== o) scope.startSearch();
  });

  $scope.startSearch = _.debounce(function() {
    $scope.$apply(function(scope) {
      scope.paginator.page = 0;
      scope.resetEntries();
    });
  }, 700);

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
    if ($scope.tab.params.entryType == entryType) {
      this.resetEntries();
    } else {
      this.paginator.page = 0;
      if (entryType) {
        this.tab.params.entryType = entryType.data.sys.id;
      } else {
        this.tab.params.entryType = null;
      }
    }
  };

  $scope.visibleInCurrentList = function(entry){
    switch ($scope.tab.params.list) {
      case 'all':
        return !entry.data.sys.deletedAt && !entry.data.sys.archivedAt;
      case 'published':
        return entry.data.sys.publishedAt > 0;
      case 'unpublished':
        return !entry.data.sys.publishedAt;
      case 'archived':
        return entry.data.sys.archivedAt > 0;
      default:
        return true;
    }
  };

  $scope.paginator = new Paginator();

  $scope.$watch(function pageParameters(scope){
    return {
      page: scope.paginator.page,
      pageLength: scope.paginator.pageLength,
      list: scope.tab.params.list,
      entryType: scope.tab.params.entryType,
      bucketId: (scope.bucketContext.bucket && scope.bucketContext.bucket.getId())
    };
  }, function(pageParameters, old, scope){
    scope.resetEntries();
  }, true);

  $scope.resetEntries = function() {
    if (this.reloadInProgress || this.resetPaused) return;
    var scope = this;

    this.reloadInProgress = true;
    this.bucketContext.bucket.getEntries(this.buildQuery(), function(err, entries, sys) {
      scope.reloadInProgress = false;
      if (err) return;
      scope.paginator.numEntries = sys.total;
      scope.$apply(function(scope){
        scope.entries = entries;
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
      queryObject['sys.publishedAt[exists]'] = false;
    } else if (this.tab.params.list == 'archived') {
      queryObject['sys.archivedAt[gt]'] = 0;
    }

    if (this.tab.params.entryType) {
      queryObject['sys.entryType'] = this.tab.params.entryType;
    }

    if (this.search.term && 0 < this.search.term.length) {
      queryObject.query = this.search.term;
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
    this.reloadInProgress = true;
    this.pauseReset();
    this.bucketContext.bucket.getEntries(this.buildQuery(), function(err, entries, sys) {
      scope.reloadInProgress = false;
      if (err) {
        scope.paginator.page--;
        return;
      }
      scope.paginator.numEntries = sys.total;
      scope.$apply(function(scope){
        var args = [scope.entries.length, 0].concat(entries);
        scope.entries.splice.apply(scope.entries, args);
      });
    });

  };

  $scope.counts = {};

  $scope.loadCounts = function() {
    var scope = this;
    this.bucketContext.bucket.getEntries({limit: 0}, function(err, entries, sys) {
      scope.$apply(function(scope) {
        scope.counts['all'] = sys.total;
      });
    });
    this.bucketContext.bucket.getEntries({limit: 0, 'sys.archivedAt[gt]': 0}, function(err, entries, sys) {
      scope.$apply(function(scope) {
        scope.counts['archived'] = sys.total;
      });
    });
    this.bucketContext.bucket.getEntries({limit: 0, 'sys.publishedAt[gt]': 0}, function(err, entries, sys) {
      scope.$apply(function(scope) {
        scope.counts['published'] = sys.total;
      });
    });
  };

  $scope.$watch('bucketContext.bucket', 'loadCounts()');

  $scope.statusClass = function(entry){
    if (entry.data.sys.publishedAt) {
      return 'published';
    } else if (entry.data.sys.archivedAt) {
      return 'archived';
    } else {
      return 'draft';
    }
  };

  // Development shorcut to quickly open an entry

  //$scope.$watch(function($scope){
  //  return !(_.isEmpty($scope.entries) || _.isEmpty($scope.entryTypes));
  //}, function(dataReady){
  //  if (dataReady) {
  //    $scope.editEntry($scope.entries[0]);
  //  }
  //});

});
