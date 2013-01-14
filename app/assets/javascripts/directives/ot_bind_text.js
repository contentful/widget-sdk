'use strict';

// Directive to bind a text-editing element directly to a shareJS
// document with a certain path
angular.module('contentful/directives').directive('otBindText', function(ShareJS) {
  return {
    restrict: 'A',
    scope: {
      doc: '=',
      path: '=otBindText'
    },
    link: function(scope, elm) {

      scope.subDoc = null;
      scope.removeBinding = null;

      scope.$watch('path', function(path, old, scope) {
        if (scope.subDoc) {
          scope.ensureStringAtPath(function() {
            scope.removeBinding = scope.subDoc.attach_textarea(elm[0]);
          });
          var args = [0, scope.subDoc.path.length].concat(path);
          scope.subDoc.path.splice.apply(scope.subDoc.path, args);
        }
      });

      scope.$watch('doc', function(doc, old, scope) {
        if (old && old != doc) {
          scope.removeBinding();
          scope.removeBinding = null;
          scope.subDoc = null;
        }

        if (doc) {
          var initialPath = scope.path ? scope.path : [];
          scope.subDoc = doc.at(initialPath);
          if (scope.path) {
            scope.ensureStringAtPath(function() {
              scope.removeBinding = scope.subDoc.attach_textarea(elm[0]);
            });
          }
        }
      });

      scope.$on('$destroy', function() {
        if (scope.removeBinding) {
          scope.removeBinding();
          scope.removeBinding = null;
        }
      });

      scope.ensureStringAtPath = function(callback) {
        if (!_.isString(ShareJS.peek(this.doc, this.path))) {
          var cb = function() {
            this.$apply(callback);
          };
          ShareJS.mkpath(this.doc, this.path, '', cb);
        } else {
          callback();
        }
      };

    }

  };
});
