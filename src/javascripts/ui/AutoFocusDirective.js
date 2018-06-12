angular.module('contentful')

/**
 * @ngdoc directive
 * @name uiAutofocus
 * @description
 * Add this attribute directive to focus an element once it is rendered
 */
.directive('uiAutofocus', ['require', require => {
  var $timeout = require('$timeout');
  return {
    restrict: 'A',
    link: function (_$scope, $element) {
      $timeout(() => {
        $element[0].focus();
      });
    }
  };
}]);
