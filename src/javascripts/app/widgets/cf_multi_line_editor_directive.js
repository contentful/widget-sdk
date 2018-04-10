'use strict';

angular.module('cf.app')
.directive('cfMultiLineEditor', ['require', function (require) {
  var createTextarea = require('editors').textarea;

  return {
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    link: function ($scope, $el, _$attrs, widgetApi) {
      var editor = createTextarea(widgetApi);
      $el.append(editor);

      // This is necessary to free the component for garbage collection.
      // Otherwise the component is kept in a cache somewhere.
      $scope.$on('$destroy', function () {
        $el.empty();
      });
    }
  };
}]);
