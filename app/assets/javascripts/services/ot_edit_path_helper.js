angular.module('contentful/services').service('otEditPathHelper', function (ShareJS, cfSpinner) {
  'use strict';

  // Require doc, path
  return {
    // Inject ShareJS functionality into the scope.
    // 2 Requirements on scope:
    //   - doc, a ShareJS document (no subdoc)
    //   - path, an array containing the path in the doc from root
    provideSubdoc: function (scope) {
      scope.$watch('doc', updateSubdoc);
      scope.$watch('path', updateSubdoc, true);

      // TODO change it so that path changes manipulate the subdoc path instead of
      // creating a new subdoc
      function updateSubdoc(n,o,scope) {
        if (scope.doc && scope.path) {
          //console.log('setting subdoc', scope.doc, scope.path);
          scope.subdoc = scope.doc.at(scope.path);
        } else {
          scope.subdoc = null;
        }
      }

    }
  };
  
});
