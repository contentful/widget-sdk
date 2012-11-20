define([
  'controllers',
], function(controllers, contentTemplate){
  'use strict';

  return controllers.controller('ContentCtrl', function($scope, client) {
    $scope.contentType = 'entries';
    $scope.entrySection = 'published'

    $scope.switchContentType = function(type){
      $scope.contentType = type;
    }

    $scope.switchEntrySection = function(section){
      $scope.entrySection = section;
    }
  });
});
