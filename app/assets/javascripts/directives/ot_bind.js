define([
  'lodash',

  'services/sharejs'
], function(_){
  'use strict';

  // Only for use inside cfFieldEditor
  return {
    name: 'otBind',
    factory: function(ShareJS) {
      return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elm, attr, ngModelCtrl) {
          
          if (attr.otBind === 'text') {
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
          } else if (attr.otBind === 'replace'){
            scope.$watch('value', function(val, old, scope) {
              if (val === old) return;
              if (scope.applyingRemoteChange) return;
              scope.changeValue(val);
            }, true);

            scope.$on('valueChanged', function(event, val) {
              event.currentScope.value = val;
            });
          } else if (attr.otBind === 'model'){
            ngModelCtrl.$viewChangeListeners.push(function(){
              scope.changeValue(ngModelCtrl.$modelValue);
            });
            scope.$on('valueChanged', function(event, val) {
              event.currentScope.value = val;
            });
          }

        } // END link function. YO DOG I HERD U LIKE CURLY BRACES

      };
    }
  };

});
