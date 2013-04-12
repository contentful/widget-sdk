angular.module('contentful/services').service('otEditPathHelper', function (ShareJS, cfSpinner) {
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
            var pathPrefixMatches = angular.equals(path.slice(0,scope.path.length), scope.path);
            if (pathPrefixMatches) {
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
        //console.log('changing value %o -> %o in %o, %o', scope.doc.getAt(scope.path), value, scope.path, scope.doc);
        if (scope.doc) {
          callback = callback || function(err){if (!err) scope.$apply();};
          try {
            var stopSpin = cfSpinner.start();
            scope.doc.setAt(scope.path, value, function () {
              callback.apply(this, arguments);
              stopSpin();
            });
            //console.log('changin value returned %o %o in doc %o version %o', err, data, scope.doc, scope.doc.version);
          } catch(e) {
            ShareJS.mkpath(scope.doc, scope.path, value, function () {
              callback.apply(this, arguments);
              stopSpin();
            });
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
          //console.log('setting subdoc', scope.doc, scope.path);
          scope.subdoc = scope.doc.at(scope.path);
        } else {
          scope.subdoc = null;
        }
      }

    }
  };
  
});
