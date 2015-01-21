'use strict';

// If you wrote a custom directive that uses ngModel to bind to a value,
// you can use otBindInternal to bind the internal value of your
// directive to both the external value and ShareJS by doing the
// following:
// <my-component ng-model="fieldData.value" ot-bind-internal="internalValue">
//
// Inside your component, have `internalValue` on the scope and update
// that one (with ngModel or without, doesn't matter).
// When you change the internal Value, call otBindInternalChangeHandler
// by
//   a) Calling it manually
//   b) binding it to ng-change on an element
//   c) Adding it to an internal ngModelController using $viewChangeListeners.$push
// That's it. This is the procedure outlined in
// cf_field_editor_directive.js, but simplified in a neat package.
//
// DO NOT CALL otBindInternalChangeHandler in a watcher on the internal value!
// That would also trigger a ShareJS update during initialization
// with a possibly undefined value. This is ONLY supposed to be called
// in response to a user-change to he internal value.
angular.module('contentful').directive('otBindInternal', ['$injector', function($injector){
  var $parse = $injector.get('$parse');
  var $q     = $injector.get('$q');
  
  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    link: function(scope, elem, attr, controllers){
      var ngModelCtrl = controllers[0];
      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;
      var getInternal = $parse(attr.otBindInternal),
          setInternal = getInternal.assign;

      scope.otBindInternalChangeHandler = function() {
        return scope.otChangeValue(getInternal(scope))
        .then(function(){
          ngModelCtrl.$setViewValue(getInternal(scope));
          return getInternal(scope);
        }, function(err){
          ngModelCtrl.$render();
          return $q.reject(err);
        });
      };

      ngModelCtrl.$render = function () {
        setInternal(scope, ngModelCtrl.$viewValue);
      };

      scope.$on('otValueChanged', function(event, path, value){
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, value);
        }
      });
    }
  };
}]);
