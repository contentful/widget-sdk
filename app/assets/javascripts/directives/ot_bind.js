'use strict';

// Only for use inside cfFieldEditor
angular.module('contentful/directives').directive('otBind', function(ShareJS) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, elm, attr, ngModelCtrl) {
      
      if (attr.otBind === 'text') {
        // Use this on text inputs/textAreas
        scope.$watch('subdoc', function(subdoc, old, scope){
          if (old && old !== subdoc) {
            if (scope.detachTextField) {
              scope.detachTextField();
              scope.detachTextField = null;
            }
          }

          if (subdoc) {
            if (_.isString(ShareJS.peek(subdoc.doc, subdoc.path))) {
              scope.detachTextField = subdoc.attach_textarea(elm[0]);
            } else {
              ShareJS.mkpath(scope.doc, subdoc.path, '', function() {
                scope.detachTextField = subdoc.attach_textarea(elm[0]);
              });
            }
          }
        });
      } else if (attr.otBind === 'model'){
        // Use this if you want to bind an ngModelController to a
        // ShareJS value
        ngModelCtrl.$viewChangeListeners.push(function(){
          scope.changeValue(ngModelCtrl.$modelValue);
        });
        scope.$on('valueChanged', function(event, val) {
          event.currentScope.value = val;
        });
      } else if (attr.otBind === 'replace'){
        // Use this if you want to simply replace values in your ShareJS
        // document. Works by simply manipulating the `value` property
        // in the scope (as established by cfFieldEditor)
        //
        // This method should be only used as a last resort as a
        // shortcut if using a model binding is not possible. Main use
        // case is easier integration into sharejs for 3rd party widget
        // providers
        scope.$watch('value', function(val, old, scope) {
          if (val === old) return;
          scope.changeValue(val);
        }, true);

        scope.$on('valueChanged', function(event, val) {
          event.currentScope.value = val;
        });
      }

    }

  };
});
