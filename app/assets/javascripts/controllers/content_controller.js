define([
  'controllers',
  'templates/entry_list'
], function(controllers, entryListTemplate){
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
        if ($scope.entrySection == 'all') {
          $scope.entries = [];
          $scope.bucket.getEntries(function(err, entries){
            if (err) return;
            $scope.$apply(function($scope){
              $scope.entries = $scope.entries.concat(entries);
            })
          });
          // $scope.bucket.getDrafts(function(err, drafts){
          //   if (err) return;
          //   $scope.$apply(function($scope){
          //     $scope.entries = $scope.entries.concat(drafts);
          //   })
          // });
        } else if ($scope.entrySection == 'published') {
          $scope.entries = [];
          $scope.bucket.getEntries(function(err, entries){
            if (err) return;
            $scope.$apply(function($scope){
              $scope.entries = entries;
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

  });
});
