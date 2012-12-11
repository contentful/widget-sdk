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
        reloadEntries();
        scope.showLoadingIndicator = true;
        setTimeout(function() {
          console.log('Reloading entries again');
          reloadEntries();
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
      entry.delete(function (err) {
        if (!err) {
          reloadEntries();
        } else {
          console.log('Error deleting entry', entry);
        }
      });
    };


    $scope.archiveEntry = function (entry) {
      entry.archive(function (err) {
        if (!err) {
          reloadEntries();
        } else {
          console.log('Error archiving entry', entry);
        }
      });
    };

    $scope.unarchiveEntry = function (entry) {
      entry.unarchive(function (err) {
        if (!err) {
          reloadEntries();
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
        scope.tab.button.options = _(entryTypes).map(function(et){
          return {
            title: et.data.name,
            value: et
          };
        });
        scope.tab.list.buttonActive(true);
      }
    });

    $scope.$on('tabButtonClicked', function(event, button, entryType){
      event.currentScope.createEntry(entryType);
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
      reloadEntries();
      if (  pageParameters.bucketId !== old.bucketId || pageParameters.bucketId && !scope.entryTypes) {
        reloadEntryTypes();
      }
    }, true);

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

    // TODO put this mofo into the scope, try to eliminate all closures
    // to the controller here
    function reloadEntries() {
      if ($scope.bucket && $scope.tab.params.contentType == 'entries') {
        var allEntries;
        if ($scope.tab.params.list == 'all') {
          allEntries = [];
          $scope.bucket.getEntries({
            order: 'sys.id',
            limit: $scope.paginator.pageLength,
            skip: $scope.paginator.skipItems()
          }, function(err, entries, sys){
            if (err) return;
            $scope.paginator.numEntries = sys.total;
            allEntries = allEntries.concat(entries);
            $scope.$apply(function($scope){
              $scope.entries = allEntries;
            });
          });
        } else if ($scope.tab.params.list == 'published') {
          allEntries = [];
          $scope.bucket.getEntries({
            order: 'sys.id',
            'sys.publishedAt[gt]': 0,
            limit: $scope.paginator.pageLength,
            skip: $scope.paginator.skipItems()
          }, function(err, entries, sys){
            if (err) return;
            $scope.paginator.numEntries = sys.total;
            allEntries = allEntries.concat(entries);
            $scope.$apply(function($scope){
              $scope.entries = allEntries;
            });
          });
        } else if ($scope.tab.params.list == 'archived') {
          allEntries = [];
          $scope.bucket.getEntries({
            order: 'sys.id',
            'sys.archivedAt[gt]': 0,
            limit: $scope.paginator.pageLength,
            skip: $scope.paginator.skipItems()
          }, function(err, entries, sys){
            if (err) return;
            $scope.paginator.numEntries = sys.total;
            allEntries = allEntries.concat(entries);
            $scope.$apply(function($scope){
              $scope.entries = allEntries;
            });
          });
        } else {
          $scope.entries = [];
        }
      }
    }

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
