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
          // scope.$watch(function(scope){
          //   return scope.$parent.subdoc;
          // }, function(doc) {
          //   scope.doc = doc;
          // });

          ngModelCtrl.$viewChangeListeners.push(function(){
            scope.subdoc.set(ngModelCtrl.$modelValue, function(err, res){
              console.log("Set field to %s, err:%o, res:%o", ngModelCtrl.$modelValue, err, res);
            });
          });
        }

      };
    }
  };

});
