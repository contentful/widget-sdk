define(function(){
  'use strict';

  return {
    name: 'cfFieldEditor',
    factory: function(widgets, $compile) {
      return {
        restrict: 'E',
        scope: {
          type:    '=',
          fieldId: '=',
          entryDoc:'=doc',
          locale:  '=',
        },
        link: function(scope, elm, attr) {
          var widget = widgets.editor(scope.type, attr.editor);

          scope.$watch('entryDoc.doc', function updateDoc(sjDoc, old ,scope) {
            if (old && old !== sjDoc) {
              old.removeListener(scope.docListener);
              scope.docListener = null;
            }

            if (sjDoc){
              scope.docListener = sjDoc.at(['fields']).on('child op', function(path, op) {
                if (path[0] == scope.fieldId && path[1] == scope.locale) {
                  //if (op.oi) {
                    //scope.$broadcast('valueReceived', op.oi);//value = op.oi;
                  //}
                  scope.$apply(function(scope) {
                    scope.$broadcast('valueChanged', sjDoc.getAt(['fields', scope.fieldId, scope.locale]));
                  });
                }
              });
            }
          });
            
          
          var stopInit = scope.$watch('subdoc', function(subdoc, old, scope) {
            if (subdoc) {
              try {
                scope.$broadcast('valueChanged', subdoc.get());
              } finally {
                stopInit();
              }
            }
          });

          scope.$watch('entryDoc.doc', updateSubdoc);
          scope.$watch('fieldId', updateSubdoc);
          scope.$watch('locale', updateSubdoc);

          function updateSubdoc(n,o,scope) {
            if (scope.entryDoc && scope.entryDoc.doc && scope.fieldId && scope.locale) {
              scope.subdoc = scope.entryDoc.doc.at(['fields', scope.fieldId, scope.locale]);
            } else {
              scope.subdoc = null;
            }
          }

          scope.changeValue = function(value, callback) {
            if (this.entryDoc) {
              this.entryDoc.doc.at(['fields', this.fieldId, this.locale]).set(value, callback);
            } else {
              console.error('No doc to push %o to', value);
            }
          };

          elm.html(widget.template + '<span class="help-inline">'+widget.name+'</span>');
          elm.on('blur', '*', function() {
            scope.$emit('inputBlurred', scope.fieldId);
          });
          $compile(elm.contents())(scope);
          if(typeof widget.link === 'function') {
            widget.link(scope, elm, attr);
          }
        }
      };
    }
  };

});
