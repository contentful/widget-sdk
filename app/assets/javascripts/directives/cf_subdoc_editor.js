'use strict';

angular.module('contentful/directives').directive('cfSubdocEditor', function(subdocClient) {

  return {
    restrict: 'A',
    scope: true,
    link: function(scope, elem, attr) {
      scope.$watch(function(scope) {
        var pathString = attr['cfSubdocEditor'];
        return scope.$parent.$eval(pathString);
      }, function(path, old, scope) {
        scope.path = path;
      }, true);

      subdocClient.injectInto(scope);
    }
  };
});
