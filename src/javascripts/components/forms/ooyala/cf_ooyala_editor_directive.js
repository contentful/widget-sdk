'use strict';

angular.module('contentful').directive('cfOoyalaEditor', [function(){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_video_editor'](),
    controller: ['$injector', '$scope', function ($injector, $scope) {
      var $controller = $injector.get('$controller');

      $scope.providerVideoEditorController = $controller('cfOoyalaEditorController');
      $scope.videoEditorController = $controller('cfVideoEditorController', {$scope: $scope});
    }]
  };
}]);
