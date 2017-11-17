'use strict';

angular.module('contentful')
.directive('cfOoyalaEditor', ['require', function (require) {
  var $controller = require('$controller');
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_video_editor'](),
    require: '^cfWidgetApi',
    link: function ($scope, $el, $attrs, widgetApi) {
      $scope.providerVideoEditorController = $controller('cfOoyalaEditorController');
      $scope.videoEditorController = $controller('cfVideoEditorController', {
        $scope: $scope,
        widgetApi: widgetApi
      });
    }
  };
}]);
