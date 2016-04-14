'use strict';

angular.module('contentful')
.directive('cfMultiVideoEditor', ['$injector', function ($injector) {
  var $controller = $injector.get('$controller');

  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_multi_video_editor'](),
    link: function (scope, elem) {
      scope.multiVideoEditorController = $controller('cfMultiVideoEditorController', {
        $scope: scope,
        widgetApi: scope.widgetApi
      });

      scope.videoInputController = videoInputController;
      function videoInputController() {
        return elem.find('cf-video-input').controller('cfVideoInput');
      }
    }
  };
}]);
