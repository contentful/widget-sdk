'use strict';

// TODO This widget is broken!!!
angular.module('contentful').directive('cfOoyalaMultiVideoEditor', [function(){

  return {
    restrict: 'E',
    scope: true,
    template: '<cf-multi-video-editor />',
    require: '^cfWidgetApi',
    link: {pre: function (scope, elem, attrs, widgetApi) {
      // TODO We should not expose the widget API on the scope, but
      // currently this is the only way we can deal with the
      // architecture of the video widgets.
      scope.widgetApi = widgetApi;
    }},
    controller: 'cfOoyalaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);
