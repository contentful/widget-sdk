'use strict';

angular.module('contentful').directive('layoutOptionsHeader', [function(){
  return {
    template: JST.layout_options_header(),
    restrict: 'E',
    scope: true,
    transclude: true,
    link: function (scope, elem) {
      if(!scope.widget) {
        var widgetId = elem.attr('data-layout-item');
        scope.widget = {
          widgetId: widgetId
        };
      }
    }
  };
}]);
