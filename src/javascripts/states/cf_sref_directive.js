angular.module('cf.app')
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
