'use strict';

angular.module('contentful').directive('layoutOptionsHeader', [function(){
  return {
    template: JST.layout_options_header(),
    restrict: 'E',
    scope: true,
    link: function (scope, elem, attrs) {
      if(!scope.widget) {
        var widgetType = elem.attr('data-layout-item');
        scope.widget = {
          widgetType: widgetType
        };
      }
      // TODO remove this when upgrading to Angular 1.3 and use transclusion
      scope.hasDetails = 'hasDetails' in attrs && scope.$eval(attrs.hasDetails);
    }
  };
}]);
