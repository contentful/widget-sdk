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
          $scope.bucket.getEntries(function(err, entries){
            if (!err) {
              $scope.$apply(function($scope){
                console.log(entries)
                $scope.entries = entries;
              })
            }
          });
        }
      }
    }

    $scope.$watch('contentType' , performNav);
    $scope.$watch('entrySection', performNav);

  });
});
