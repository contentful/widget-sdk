define([
  'controllers',
], function(controllers, contentTemplate){
  'use strict';

  return controllers.controller('ContentCtrl', function($scope, client) {
    $scope.contentType = 'entries';
  });
});
