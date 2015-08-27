'use strict';

/**
 * @ngdoc directive
 * @name otBindNgModel
 * @scope.requires otPath
 * @scope.requires otSubDoc
 * @description
 * This directive should be used together with ngModel.
 * It binds the value specified for the ngModel to its respective otDoc value.
 */
angular.module('contentful').directive('otBindNgModel', ['$parse', function($parse) {
  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    link: function(scope, elm, attr, controllers) {
      var ngModelCtrl = controllers[0];
      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;

      ngModelCtrl.$viewChangeListeners.push(function(){
        scope.otSubDoc.changeValue(ngModelCtrl.$modelValue);
        // TODO this is wrong because it does not handle the error case
        // This directive was writte for Angular 1.1
        // With Angular 1.3+ we could make use of async validations to revert when otSubDoc.changeValue fails
      });

      scope.$on('otValueChanged', function(event, path, val) {
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, val);
        }
      });
    }
  };
}]);
