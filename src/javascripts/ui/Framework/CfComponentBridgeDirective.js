angular.module('contentful')
/**
 * @ngdoc directive
 * @description
 *
 * This directive renders a VDOM tree in its place. The tree is passed
 * bound by the `component` attribute. The value of that attribute is
 * evaluated in the parent scope. Whenever the tree reference updates
 * the component is rerendered.
 *
 * ~~~js
 * {
 *   template: '<cf-component-bridge component="myComponent">'
 *   controller: function ($scope) {
 *     $scope.$watch('myData', render)
 *
 *     function render (data) {
 *       $scope.myComponent = h('h1', ['Hello world'])
 *     }
 *   }
 * }
 */
.directive('cfComponentBridge', ['require', function (require) {
  var createMountPoint = require('ui/Framework/DOMRenderer').default;
  return {
    restrict: 'E',
    scope: { component: '=' },
    link: function ($scope, $element) {
      var mountPoint = createMountPoint($element.get(0));
      $scope.$watch('component', mountPoint.render);
      $scope.$on('$destroy', mountPoint.destroy);
    }
  };
}]);
