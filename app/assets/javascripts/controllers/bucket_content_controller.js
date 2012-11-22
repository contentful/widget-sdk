define([
  'controllers',
  'templates/entry_list',
  'lib/paginator'
], function(controllers, entryListTemplate, Paginator){
  'use strict';

  return controllers.controller('BucketContentCtrl', function($scope) {
    $scope.contentType = 'entries';
    $scope.entrySection = 'all';

    $scope.editEntry = function(entry) {
      $scope.currentEditEntry = entry;
      var stop = $scope.$on('exitEditor', function(event){
        $scope.currentEditEntry = null;
        stop();
      });
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

    function reloadEntries() {
      if ($scope.bucket && $scope.contentType == 'entries') {
        $scope.entries = [];
        var allEntries;
        if ($scope.entrySection == 'all') {
          allEntries = [];
          $scope.paginator.page = 0;
          $scope.bucket.getEntries({order: 'sys.createdAt', limit: 1000}, function(err, entries){
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
          $scope.bucket.getEntries({order: 'sys.createdAt', limit: 1000}, function(err, entries){
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

    $scope.$watch('bucket', reloadEntries);
    $scope.$watch('contentType' , performNav);
    $scope.$watch('entrySection', performNav);

  });
});
