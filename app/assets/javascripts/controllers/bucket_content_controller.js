define([
  'controllers',
  'templates/entry_list',
  'lib/paginator',
  'lodash'
], function(controllers, entryListTemplate, Paginator, _){
  'use strict';

  return controllers.controller('BucketContentCtrl', function($scope) {
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
          section: 'content',
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

    $scope.searchEntries = function (term) {
      // TODO with an empty searchterm, behave as if showing the
      // unfiltered list
      //
      // Always just reload and use the searchterm as a filter if
      // applicable
      $scope.bucket.getEntries({
        query: term,
        order: 'sys.id',
        limit: $scope.paginator.pageLength,
        skip: $scope.paginator.skipItems()
      }, function (err, entries, sys) {
        if (err) return;
        $scope.paginator.numEntries = sys.total;
        $scope.$apply(function($scope){
          $scope.entries = entries;
        });
      });
    };

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
        reloadEntryTypes();
      }
    }, true);

    // TODO put function into scope
    function reloadEntryTypes(){
      if ($scope.bucket && $scope.tab.params.contentType== 'entries') {
        $scope.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes){
          if (err) return;
          $scope.$apply(function($scope){
            var newET = {};
            _(entryTypes).each(function(entryType){
              newET[entryType.getId()] = entryType;
            });
            $scope.entryTypes = newET;
            $scope.entryTypeList = entryTypes;
          });
        });
      }
    }

    $scope.reloadEntries = function() {
      var scope = this;
      if (this.bucket && this.tab.params.contentType == 'entries') {
        var allEntries;
        if (this.tab.params.list == 'all') {
          allEntries = [];
          this.bucket.getEntries({
            order: 'sys.id',
            limit: this.paginator.pageLength,
            skip: this.paginator.skipItems()
          }, function(err, entries, sys){
            if (err) return;
            scope.paginator.numEntries = sys.total;
            allEntries = allEntries.concat(entries);
            scope.$apply(function(scope){
              scope.entries = allEntries;
            });
          });
        } else if (this.tab.params.list == 'published') {
          allEntries = [];
          this.bucket.getEntries({
            order: 'sys.id',
            'sys.publishedAt[gt]': 0,
            limit: this.paginator.pageLength,
            skip: this.paginator.skipItems()
          }, function(err, entries, sys){
            if (err) return;
            scope.paginator.numEntries = sys.total;
            allEntries = allEntries.concat(entries);
            scope.$apply(function(scope){
              scope.entries = allEntries;
            });
          });
        } else if (this.tab.params.list == 'archived') {
          allEntries = [];
          this.bucket.getEntries({
            order: 'sys.id',
            'sys.archivedAt[gt]': 0,
            limit: this.paginator.pageLength,
            skip: this.paginator.skipItems()
          }, function(err, entries, sys){
            if (err) return;
            scope.paginator.numEntries = sys.total;
            allEntries = allEntries.concat(entries);
            scope.$apply(function(scope){
              scope.entries = allEntries;
            });
          });
        } else {
          this.entries = [];
        }
      }
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
