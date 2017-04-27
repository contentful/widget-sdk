angular.module('contentful')

/**
 * @ngdoc directive
 * @name uiAutofocus
 * @description
 * Add this attribute directive to focus an element once it is rendered
 */
.directive('uiAutofocus', ['require', function (require) {
  var $timeout = require('$timeout');
  return {
    restrict: 'A',
    link: function (_$scope, $element) {
      $timeout(function () {
        $element[0].focus();
      });
    }
  };
}]);
