'use strict';
/**
 * @ngdoc directive
 * @name otBindObjectValue
 * @scope.requires otPath
 * @scope.requires otSubDoc
 *
 * @description
 * This directive should be used when the value of the field is an object
 * and we wish to bind the ngModel value to a property of that object.
 * It can also be used when the value is a string that doesn't need diffing.
 *
 * The usage example assumes scopeValue is a property on the scope. You could
 * also specify a property of that value, such as scopeValue.property.
 *
 * @usage[html]
 * <my-component ng-model="fieldData.value" ot-bind-object-value="scopeValue">
 */
angular.module('contentful').directive('otBindObjectValue', ['$injector', function($injector){
  var $parse = $injector.get('$parse');
  var $q     = $injector.get('$q');

  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    link: function(scope, elem, attr, controllers){
      var ngModelCtrl = controllers[0];
      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;
      var getInternal = $parse(attr.otBindObjectValue),
          setInternal = getInternal.assign;

      /**
       * @ngdoc method
       * @name otBindObjectValue#scope.otBindObjectValueCommit
       * @description
       * This should be called when you wish to commit the value to ShareJS.
       * It will also set the viewValue for the the ngModel.
       * You can also provide otBindObjectValueCommit to ng-change or to $viewChangeListeners
       *
       * **Warning**
       * Don't call otBindObjectValueCommit in a watcher, otherwise it will trigger
       * a ShareJS update on the initialization of the directive, which is probably
       * not what you want.
       *
       * @return {Promise}
      */
      scope.otBindObjectValueCommit = function() {
        var value = getInternal(scope);
        // Do not call otSubDoc.changeValue() with null. See BUG#6696
        if(value === null) {
          value = undefined;
        }
        return scope.otSubDoc.changeValue(value)
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
