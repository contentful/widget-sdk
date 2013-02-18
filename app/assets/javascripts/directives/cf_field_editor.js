'use strict';

angular.module('contentful/directives').directive('cfFieldEditor', function(widgets, $compile, ShareJS) {
  return {
    restrict: 'E',
    scope: {
      type: '=',
      fieldId: '=',
      doc: '=',
      locale: '=',
      bucketContext: '=',
      value: '='
    },
    link: function(scope, elm, attr) {
      var widget = widgets.editor(scope.type, attr.editor);

      scope.$watch('doc', function updateDoc(doc, old ,scope) {
        if (old && old !== doc) {
          old.removeListener(scope.docListener);
          scope.docListener = null;
        }

        if (doc){
          scope.docListener = doc.at(['fields']).on('child op', function(path) {
            if (path[0] == scope.fieldId && path[1] == scope.locale) {
              //if (op.oi) {
                //scope.$broadcast('valueReceived', op.oi);//value = op.oi;
              //}
              scope.$apply(function(scope) {
                scope.$broadcast('valueChanged', doc.getAt(['fields', scope.fieldId, scope.locale]));
              });
            }
          });
        }
      });
      
      var stopInit = scope.$watch('subdoc', function(subdoc, old, scope) {
        if (subdoc) {
          try {
            var value = ShareJS.peek(scope.doc, ['fields', scope.fieldId, scope.locale]);
            scope.$broadcast('valueChanged', value);
          } finally {
            stopInit();
          }
        }
      });

      scope.$watch('doc', updateSubdoc);
      scope.$watch('fieldId', updateSubdoc);
      scope.$watch('locale', updateSubdoc);

      function updateSubdoc(n,o,scope) {
        if (scope.doc && scope.fieldId && scope.locale) {
          scope.subdoc = scope.doc.at(['fields', scope.fieldId, scope.locale]);
        } else {
          scope.subdoc = null;
        }
      }

      scope.changeValue = function(value, callback) {
        if (this.doc) {
          try {
            this.doc.setAt(['fields', this.fieldId, this.locale], value, callback);
          } catch(e) {
            ShareJS.mkpath(this.doc, ['fields', this.fieldId, this.locale], value, callback);
          }
        } else {
          console.error('No doc to push %o to', value);
        }
      };

      elm.html(widget.template);
      elm.on('blur', '*', function() {
        scope.$emit('inputBlurred', scope.fieldId);
      });
      $compile(elm.contents())(scope);
      if(typeof widget.link === 'function') {
        widget.link(scope, elm, attr);
      }
    }
  };
});
