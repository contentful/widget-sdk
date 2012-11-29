define([
  'angular',
  'templates/entry_list'
], function(angular, entryListTemplate){
  'use strict';

  return {
    name: 'otBind',
    factory: function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elm, attr, ngModelCtrl) {

          scope.$on('replaceValue', function(event, v){
            scope.value = v;
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
            scope.$watch('doc', function(doc, old, scope){
              if (old && scope.stopReplaceListener) {
                scope.stopReplaceListener();
                scope.stopReplaceListener = null;
              }

              if (doc) {
                scope.value = scope.doc.value();
                scope.stopReplaceListener = doc.onReplace(function(was, now) {
                  scope.$apply(function(){
                    scope.value = scope.doc.value();
                  });
                });

                ngModelCtrl.$viewChangeListeners.push(function(){
                  scope.doc.set(ngModelCtrl.$modelValue, function(err, res){
                    console.log("Set field to %s, err:%o, res:%o", ngModelCtrl.$modelValue, err, res);
                  });
                });
              }
            });
          }

        } // END link function. YO DOG I HERD U LIKE CURLY BRACES

      };
    }
  };

});
