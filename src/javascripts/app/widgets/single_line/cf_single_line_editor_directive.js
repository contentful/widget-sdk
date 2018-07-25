'use strict';

angular.module('contentful')
.directive('cfSingleLineEditor', ['require', require => {
  const Editors = require('editors');

  return {
    scope: {},
    require: '^cfWidgetApi',
    restrict: 'E',
    link: function ($scope, $el, _attributes, widgetApi) {
      const editor = Editors.textInput(widgetApi);
      $el.append(editor);

      // This is necessary to free the component for garbage collection.
      // Otherwise the component is kept in a cache somewhere.
      $scope.$on('$destroy', () => {
        $el.empty();
      });
    }
  };
}]);
