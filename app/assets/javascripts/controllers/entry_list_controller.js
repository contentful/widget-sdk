define([
  'controllers',
  'lib/paginator',
  'lodash'
], function(controllers, Paginator, _){
  'use strict';

  return controllers.controller('EntryListCtrl', function($scope) {
    $scope.contentType = 'entries';
    $scope.entrySection = 'all';

    $scope.editEntry = function(entry, mode) {
      if (mode === undefined) mode = 'edit';
      // TODO prevent against null entry
      var editor = _($scope.tab.list.items).find(function(tab){
        // TODO Since we have the identitymap we can use identity check
        // here:
        return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
      });
      if (!editor) {
        var entryType = $scope.entryTypes[entry.data.sys.entryType];
        editor = $scope.tab.list.add({
          viewType: 'entry-editor',
          section: 'entries',
          params: {
            entry: entry,
            entryType: entryType,
            bucket: $scope.bucket,
            mode: mode
          },
          button: $scope.tab.button,
          title: (mode == 'edit' ? 'Edit ' : 'New ') + entryType.data.name
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

    $scope.createEntry = function(entryType) {
      $scope.bucket.createEntry({
        sys: {
          entryType: entryType.getId()
        }
      }, function(err, entry){
        if (!err) {
          $scope.$apply(function(scope){
            scope.editEntry(entry, 'create');
          });
        } else {
          console.log('Error creating entry', err);
        }
      });
    };

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

    $scope.$watch('entryTypes', function (entryTypes, old, scope) {
      if (scope.tab.params.contentType == 'entries') {
        entryTypes = _(entryTypes).filter(function(et) {
          return et.data.sys.publishedAt && et.data.sys.publishedAt > 0;
        });
        scope.tab.button.options = _(entryTypes).map(function(et){
          return {
            title: et.data.name,
            value: et
          };
        });
        scope.tab.list.buttonActive(true);
      } else {
        // Later when we have media replace button by "add media" button
      }
    });

    $scope.$on('tabButtonClicked', function(event, button, entryType){
      if (button == event.currentScope.tab.button) {
        event.currentScope.createEntry(entryType);
      }
    });

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
        contentType: scope.tab.params.contentType,
        list: scope.tab.params.list,
        bucketId: (scope.bucket && scope.bucket.getId())
      };
    }, function(pageParameters, old, scope){
      scope.reloadEntries();
      if (  pageParameters.bucketId !== old.bucketId || pageParameters.bucketId && !scope.entryTypes) {
        scope.reloadEntryTypes();
      }
    }, true);

    $scope.reloadEntryTypes = function(){
      var scope = this;
      this.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes){
        if (err) return;
        scope.$apply(function(scope){
          var newET = {};
          _(entryTypes).each(function(entryType){
            newET[entryType.getId()] = entryType;
          });
          scope.entryTypes = newET; // TODO We might not need this since the identityMap already performs the same function. We only need a way to look inside.
          scope.entryTypeList = entryTypes;
        });
      });
    };

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
      this.bucket.getEntries(queryObject, function(err, entries, sys) {
        scope.reloadInProgress = false;
        if (err) return;
        scope.paginator.numEntries = sys.total;
        scope.$apply(function(scope){
          scope.entries = entries;
        });
      });

      //if (this.bucket && this.tab.params.contentType == 'entries') {
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
