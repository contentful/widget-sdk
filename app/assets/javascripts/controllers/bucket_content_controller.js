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
      var stop = $scope.$on('exitEditor', function(event){
        $scope.currentEditEntry = null;
        stop();
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

    $scope.pageContent = function(){
      return $scope.paginator.slice($scope.entries);
    };

    $scope.$watch('entries.length', function(numEntries){
      $scope.paginator.numEntries = numEntries;
    });

    function performNav() {
      if ($scope.contentType == 'entries' ) {
        if ($scope.entrySection.match(/all|published/)) {
          $scope.contentTemplate = entryListTemplate;
          reloadEntries();
        }
      }
    }

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
          $scope.paginator.page = 0;
          $scope.bucket.getEntries({order: 'sys.id', limit: 1000}, function(err, entries){
            if (err) return;
            allEntries = allEntries.concat(entries);
            $scope.$apply(function($scope){
              $scope.entries = allEntries;
            });
          });
          // $scope.bucket.getDrafts({order: 'sys.createdAt', limit: 1000}, function(err, drafts){
          //   if (err) return;
          //   $scope.$apply(function($scope){
          //     $scope.entries = $scope.entries.concat(drafts);
          //   })
          // });
        } else if ($scope.entrySection == 'published') {
          allEntries = [];
          $scope.paginator.page = 0;
          $scope.bucket.getEntries({order: 'sys.id', limit: 1000}, function(err, entries){
            if (err) return;
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


    $scope.$watch('bucket', reloadEntries);
    $scope.$watch('bucket', reloadEntryTypes);
    $scope.$watch('contentType' , performNav);
    $scope.$watch('entrySection', performNav);

  });
});
