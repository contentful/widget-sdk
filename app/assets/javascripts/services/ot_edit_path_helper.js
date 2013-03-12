angular.module('contentful/services').service('otEditPathHelper', function (ShareJS) {
  'use strict';

  // Require doc, path
  return {
    // Inject ShareJS functionality into the scope.
    // 2 Requirements on scope:
    //   - doc, a ShareJS document (no subdoc)
    //   - path, an array containing the path in the doc from root
    injectInto: function(scope) {
      // TODO move removeListener as a hidden var here
      scope.editable = !!scope.doc;

      scope.$watch('doc', function updateDoc(doc, old ,scope) {
        if (old && old !== doc) {
          old.removeListener(scope.docListener);
          scope.docListener = null;
        }

        if (doc){
          scope.docListener = doc.at([]).on('child op', function(path) {
            if (angular.equals(path, scope.path)) {
              scope.$apply(function(scope) {
                scope.$broadcast('valueChanged', doc.getAt(scope.path));
              });
            }
          });
          var value = ShareJS.peek(scope.doc, scope.path);
          scope.$broadcast('valueChanged', value);
          scope.editable = true;
        } else {
          scope.$broadcast('valueChanged', scope.value);
          scope.editable = false;
        }
      });

      scope.$on('$destroy', function (event) {
        var scope = event.currentScope;
        if (scope.doc && scope.docListener) {
          scope.doc.removeListener(scope.docListener);
          scope.docListener = null;
        }
      });

      scope.changeValue = function(value, callback) {
        if (scope.doc) {
          try {
            scope.doc.setAt(scope.path, value, callback);
          } catch(e) {
            ShareJS.mkpath(scope.doc, scope.path, value, callback);
          }
        } else {
          console.error('No doc to push %o to', value);
        }
      };

    },

    provideSubdoc: function (scope) {
      scope.$watch('doc', updateSubdoc);
      scope.$watch('path', updateSubdoc, true);

      // TODO change it so that path changes manipulate the subdoc path instead of
      // creating a new subdoc
      function updateSubdoc(n,o,scope) {
        if (scope.doc && scope.path) {
          console.log('setting subdoc', scope.doc, scope.path);
          scope.subdoc = scope.doc.at(scope.path);
        } else {
          scope.subdoc = null;
        }
      }

    }
  };
  
});
