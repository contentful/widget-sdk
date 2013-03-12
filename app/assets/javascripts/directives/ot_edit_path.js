'use strict';

// Opens new scope, binds 'path' to whatever the argument to ot-edit-path
// evaluates to in the current scope and injects the subdocClient into the scope
angular.module('contentful/directives').directive('otEditPath', function(subdocClient) {

  return {
    restrict: 'A',
    scope: true,
    link: function(scope, elem, attr) {
      scope.$watch(function(scope) {
        var pathString = attr['otEditPath'];
        return scope.$eval(pathString);
      }, function(path, old, scope) {
        scope.path = path;
      }, true);

      subdocClient.injectInto(scope);
    }
  };
});
