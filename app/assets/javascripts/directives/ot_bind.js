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
          scope.$on('replaceValue', function(event, v){
            event.currentScope.value = v;
          });

          if (attr.otBind === 'text') {
            scope.$watch('doc', function(doc, old, scope){
              if (old) {
              }

              if (doc) {
                doc.attachToTextInput(elm[0]);
              }
            });
          } else if (attr.otBind === 'replace'){
            var stopReplaceListener;
            scope.$watch('doc', function(doc, old, scope){
              if (old && stopReplaceListener) {
                stopReplaceListener();
                stopReplaceListener = null;
              }

              if (doc) {
                scope.value = scope.doc.value();
                stopReplaceListener = doc.onReplace(function() {
                  scope.$apply(function(){
                    scope.value = scope.doc.value();
                  });
                });

                ngModelCtrl.$viewChangeListeners.push(function(){
                  scope.doc.set(ngModelCtrl.$modelValue/*, function(err, res){
                    console.log('Set field to %s, err:%o, res:%o', ngModelCtrl.$modelValue, err, res);
                  }*/);
                });
              }
            });
          }

        } // END link function. YO DOG I HERD U LIKE CURLY BRACES

      };
    }
  };

});
