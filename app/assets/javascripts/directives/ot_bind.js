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
                doc.at(scope.getPath()).attach_textarea(elm[0])
              }
            });
          } else if (attr.otBind === 'replace'){
            ngModelCtrl.$viewChangeListeners.push(function(){
              scope.doc.at(scope.getPath()).set(ngModelCtrl.$modelValue, function(err, res){
                // console.log("Set field to %s, err:%o, res:%o", ngModelCtrl.$modelValue, err, res);
              });
            });
          }

        }

      };
    }
  };

});
