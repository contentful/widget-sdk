define(function(){
  'use strict';

  // Only for use inside cfFieldEditor
  return {
    name: 'otBind',
    factory: function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elm, attr, ngModelCtrl) {
          
          if (attr.otBind === 'text') {
            // TODO: Multiple otBind = text would overwrite each others
            // detachTextField methods in the scope. (or maybe not
            // because ngModel enforces new scope?)
            scope.$watch('subdoc', function(subdoc, old, scope){
              if (old && old !== subdoc) {
                if (scope.detachTextField) {
                  scope.detachTextField();
                  scope.detachTextField = null;
                }
              }

              if (subdoc) {
                scope.detachTextField = subdoc.attach_textarea(elm[0]);
              }
            });
          } else if (attr.otBind === 'replace'){
            scope.$watch('value', function(val, old, scope) {
              if (val === old) return;
              scope.changeValue(val);
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
