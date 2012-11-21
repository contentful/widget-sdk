define([
  'controllers',
  'templates/entry_list',
  'lib/paginator'
], function(controllers, entryListTemplate, Paginator){
  'use strict';

  return controllers.controller('ContentCtrl', function($scope, client) {
    $scope.contentType = 'entries';
    $scope.entrySection = 'all'


    $scope.switchContentType = function(type){
      $scope.contentType = type;
    };

    $scope.switchEntrySection = function(section){
      $scope.entrySection = section;
    };

    $scope.paginator = new Paginator();

    $scope.pageContent = function(){
      return $scope.paginator.slice($scope.entries);
    }

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
        if ($scope.entrySection == 'all') {
          var allEntries = [];
          $scope.paginator.page = 0;
          $scope.bucket.getEntries(function(err, entries){
            if (err) return;
            allEntries = allEntries.concat(entries);
            $scope.$apply(function($scope){
              $scope.entries = allEntries;
            })
          });
          // $scope.bucket.getDrafts(function(err, drafts){
          //   if (err) return;
          //   $scope.$apply(function($scope){
          //     $scope.entries = $scope.entries.concat(drafts);
          //   })
          // });
        } else if ($scope.entrySection == 'published') {
          var allEntries = [];
          $scope.paginator.page = 0;
          $scope.bucket.getEntries(function(err, entries){
            if (err) return;
            allEntries = allEntries.concat(entries);
            $scope.$apply(function($scope){
              $scope.entries = allEntries;
            })
          });
        } else {
          $scope.entries = [];
        }
      }
    }

    $scope.$watch('bucket', reloadEntries);
    $scope.$watch('contentType' , performNav);
    $scope.$watch('entrySection', performNav);

    $scope.log = function() {
      console.log.apply(console, arguments);
    }

  });
});
