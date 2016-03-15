'use strict';

angular.module('contentful').directive('cfKalturaEditor', [function(){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_video_editor'](),
    controller: ['$injector', '$scope', function ($injector, $scope) {
      var $controller = $injector.get('$controller');
      var KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
      var kalturaClientWrapper = $injector.get('kalturaClientWrapper');
      var spaceContext = $injector.get('spaceContext');
      kalturaClientWrapper.setOrganizationId(spaceContext.space.getOrganizationId());

      $scope.providerVideoEditorController = _.extend({}, KalturaEditorControllerMixin);
      $scope.videoEditorController = $controller('cfVideoEditorController', {$scope: $scope});
    }]
  };
}]);

