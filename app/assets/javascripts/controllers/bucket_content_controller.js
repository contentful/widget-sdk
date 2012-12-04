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

    $scope.editEntry = function(entry) {
      // TODO prevent against null entry
      $scope.currentEditEntry = entry;
      var stop = $scope.$on('exitEditor', function(){
        reloadEntries();
        $scope.currentEditEntry = null;
        stop();
      });
    };

    $scope.createEntry = function(entryType) {
      $scope.bucket.createEntry({
        sys: {
          entryType: entryType.getId()
        }
      }, function(err, entry){
        if (!err) {
          $scope.$apply(function(scope){
            scope.editEntry(entry);
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

    $scope.searchEntries = function (term) {
      // TODO with an empty searchterm, behave as if showing the
      // unfiltered list
      $scope.bucket.getEntries({
        'sys.id': term,
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

    $scope.currentEntryType = function(){
      return $scope.entryTypes[$scope.currentEditEntry.data.sys.entryType];
    };

    $scope.switchContentType = function(type){
      $scope.contentType = type;
    };

    $scope.switchEntrySection = function(section){
      $scope.entrySection = section;
    };

    $scope.paginator = new Paginator();

    $scope.$watch(function pageParameters(scope){
      return {
        page: scope.paginator.page,
        pageLength: scope.paginator.pageLength,
        contentType: scope.contentType,
        entrySection: scope.entrySection,
        bucketId: (scope.bucket && scope.bucket.getId())
      };
    }, function(pageParameters, old, scope){
      reloadEntries();
      if (  pageParameters.bucketId !== old.bucketId || pageParameters.bucketId && !scope.entryTypes) {
        reloadEntryTypes();
      }
    }, true);

    function reloadEntryTypes(){
      if ($scope.bucket && $scope.contentType == 'entries') {
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

    function reloadEntries() {
      if ($scope.bucket && $scope.contentType == 'entries') {
        $scope.entries = [];
        var allEntries;
        if ($scope.entrySection == 'all') {
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
        } else if ($scope.entrySection == 'published') {
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
        } else {
          $scope.entries = [];
        }
      }
    }

    // Development shorcut to quickly open an entry

    // $scope.$watch(function($scope){
    //   return !(_($scope.entries).isEmpty() || _($scope.entryTypes).isEmpty());
    // }, function(dataReady){
    //   if (dataReady) {
    //     $scope.editEntry(_($scope.entries).find(function(entry){return entry.data.sys.id === 'ha1agjmr0'}));
    //   }
    // })

  });
});
