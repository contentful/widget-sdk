angular.module('cf.app')
/**
 * @ngdoc directive
 * @name cfSref
 * @description
 * Attribute directive similar to `uiSref` but instead of separating
 * state name and parameters they are passed as one value.
 *
 * The state references accepted by this directive can be generated
 * with the `states/Navigator` module.
 */
.directive('cfSref', ['require', function (require) {
  var $state = require('$state');
  return {
    restrict: 'A',
    link: function ($scope, _$elem, $attrs) {
      $scope.$watch($attrs.cfSref, function (state) {
        $attrs.$set('href', $state.href(state.path.join('.'), state.params));
      });
    }
  };
}]);
