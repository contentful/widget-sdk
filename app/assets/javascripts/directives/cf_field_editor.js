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
          fieldsDoc:'=doc',
          locale:  '=',
        },
        link: function(scope, elm, attr) {
          var widget = widgets.editor(scope.type, attr.editor);

          scope.$watch('fieldsDoc.doc', function updateDoc(sjDoc, old ,scope) {
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
                var value = scope.fieldsDoc.subdoc([scope.fieldId, scope.locale]).value();
                scope.$broadcast('valueChanged', value);
              } finally {
                stopInit();
              }
            }
          });

          scope.$watch('fieldsDoc.doc', updateSubdoc);
          scope.$watch('fieldId', updateSubdoc);
          scope.$watch('locale', updateSubdoc);

          function updateSubdoc(n,o,scope) {
            if (scope.fieldsDoc && scope.fieldsDoc.doc && scope.fieldId && scope.locale) {
              scope.subdoc = scope.fieldsDoc.doc.at(['fields', scope.fieldId, scope.locale]);
            } else {
              scope.subdoc = null;
            }
          }

          scope.changeValue = function(value, callback) {
            if (this.fieldsDoc) {
              this.fieldsDoc.subdoc([this.fieldId, this.locale]).set(value, callback);
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
