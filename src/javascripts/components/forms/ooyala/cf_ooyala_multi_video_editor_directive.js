'use strict';

// TODO This widget is broken!!!
angular.module('contentful').directive('cfOoyalaMultiVideoEditor', [function(){

  return {
    restrict: 'E',
    scope: true,
    template: '<cf-multi-video-editor />',
    require: '^cfWidgetApi',
    link: function (scope, elem, attrs, widgetApi) {
      scope.widgetApi = widgetApi;
    },
    controller: 'cfOoyalaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);
