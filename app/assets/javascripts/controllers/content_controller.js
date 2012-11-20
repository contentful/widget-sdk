define([
  'controllers',
  'templates/entry_list'
], function(controllers, entryListTemplate){
  'use strict';

  return controllers.controller('ContentCtrl', function($scope, client) {
    $scope.contentType = 'entries';
    $scope.entrySection = 'published'

    $scope.switchContentType = function(type){
      $scope.contentType = type;
    };

    $scope.switchEntrySection = function(section){
      $scope.entrySection = section;
    };

    function performNav() {
      if ($scope.contentType == 'entries' ) {
        if ($scope.entrySection == 'published') {
          $scope.contentTemplate = entryListTemplate;
          reloadEntries();
        }
      }
    }

    function reloadEntries() {
      if ($scope.bucket && $scope.contentType == 'entries') {
        if ($scope.entrySection == 'published') {
          $scope.bucket.getEntries(function(err, entries){
            if (!err) {
              $scope.$apply(function($scope){
                $scope.entries = entries;
              })
            }
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
