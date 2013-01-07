define([
  'controllers',
  'lib/paginator',
  'lodash'
], function(controllers, Paginator, _){
  'use strict';

  return controllers.controller('EntryListCtrl', function($scope) {
    $scope.contentType = 'entries';
    $scope.entrySection = 'all';

    $scope.editEntry = function(entry) {
      var editor = _($scope.tab.list.items).find(function(tab){
        return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
      });
      if (!editor) {
        editor = $scope.tab.list.add({
          viewType: 'entry-editor',
          section: 'entries',
          params: {
            entry: entry,
            bucket: $scope.bucket,
            mode: 'edit'
          },
          title: 'Edit Entry'
        });
      }
      editor.activate();
    };

    $scope.$on('tabBecameActive', function(event, tab){
      var scope = event.currentScope;
      if (tab == scope.tab) {
        console.log('Reloading entries');
        scope.reloadEntries();
        scope.showLoadingIndicator = true;
        setTimeout(function() {
          console.log('Reloading entries again');
          scope.reloadEntries();
          scope.showLoadingIndicator = false;
        }, 3000);
      }
    });

    $scope.$watch('bucketContext.entryTypes', function(entryTypes, old, scope) {
      scope.entryTypes = _.object(_(entryTypes).map(function(et) {
        return [et.data.sys.id, et];
      })).valueOf();
    });

    $scope.deleteEntry = function (entry) {
      var scope = this;
      entry.delete(function (err) {
        if (!err) {
          scope.reloadEntries();
        } else {
          console.log('Error deleting entry', entry);
        }
      });
    };


    $scope.archiveEntry = function (entry) {
      var scope = this;
      entry.archive(function (err) {
        if (!err) {
          scope.reloadEntries();
        } else {
          console.log('Error archiving entry', entry);
        }
      });
    };

    $scope.unarchiveEntry = function (entry) {
      var scope = this;
      entry.unarchive(function (err) {
        if (!err) {
          scope.reloadEntries();
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
        scope.reloadEntries();
      });
    }, 700);

    $scope.switchContentType = function(type){
      $scope.tab.params.contentType = type;
    };

    $scope.switchList = function(list){
      $scope.tab.params.list = list;
    };

    $scope.visibleInCurrentList = function(entry){
      switch ($scope.tab.params.list) {
        case 'all':
          return !entry.data.sys.deletedAt && !entry.data.sys.archivedAt;
        case 'published':
          return entry.data.sys.publishedAt > 0;
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
        bucketId: (scope.bucketContext.bucket && scope.bucketContext.bucket.getId())
      };
    }, function(pageParameters, old, scope){
      scope.reloadEntries();
    }, true);

    $scope.reloadEntries = function() {
      if (this.reloadInProgress) return;

      var scope = this;
      var queryObject = {
        order: '-sys.updatedAt',
        limit: this.paginator.pageLenth,
        skip: this.paginator.skipItems()
      };

      if (this.tab.params.list == 'all') {
        // do nothing
      } else if (this.tab.params.list == 'published') {
        queryObject['sys.publishedAt[gt]'] = 0;
      } else if (this.tab.params.list == 'archived') {
        queryObject['sys.archivedAt[gt]'] = 0;
      }

      if (this.search.term && 0 < this.search.term.length) {
        queryObject.query = this.search.term;
      }

      this.reloadInProgress = true;
      this.bucketContext.bucket.getEntries(queryObject, function(err, entries, sys) {
        scope.reloadInProgress = false;
        if (err) return;
        scope.paginator.numEntries = sys.total;
        scope.$apply(function(scope){
          scope.entries = entries;
        });
      });
    };

    // Development shorcut to quickly open an entry

    //$scope.$watch(function($scope){
    //  return !(_($scope.entries).isEmpty() || _($scope.entryTypes).isEmpty());
    //}, function(dataReady){
    //  if (dataReady) {
    //    $scope.editEntry($scope.entries[0]);
    //  }
    //});

  });
});
