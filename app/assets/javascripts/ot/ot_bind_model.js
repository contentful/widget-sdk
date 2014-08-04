'use strict';

// Use this directive in combination with ngModel on an element to
// automatically propagate changes to the model into ShareJS
// The Position where the change is made in ShareJS is defined by the
// otPath directive.
//
// This is intended to be used with 3rd party directives that use
// ngModel, not custom directives.
angular.module('contentful').directive('otBindModel', ['$parse', function($parse) {
  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    link: function(scope, elm, attr, controllers) {
      var ngModelCtrl = controllers[0];
      var ngModelGet = $parse(attr['ngModel']),
          ngModelSet = ngModelGet.assign;
      ngModelCtrl.$viewChangeListeners.push(function(){
        scope.otChangeValue(ngModelCtrl.$modelValue);
      });
      scope.$on('otValueChanged', function(event, path, val) {
        if (path === event.currentScope.otPath) ngModelSet(event.currentScope, val);
      });
    }
  };
}]);
