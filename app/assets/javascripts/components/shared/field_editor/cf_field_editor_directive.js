'use strict';

// To build a nice widget that works with ShareJS and updates the local model correctly
// it needs to require an ngModelCtrl and do this:
//
// var ngModelGet = $parse(attr.ngModel),
//     ngModelSet = ngModelGet.assign;
//
// changeHandler (widget value changed internally)
//   ShareJS submit
//    success: ngModelCtrl.$setViewValue(internal value)
//    fail: reset internal value to ngModelCtr.$modelValue
//          OR simply abort if nothing has been changed on the scope
//
// ngModelCtrl.$render
//    set internal value to ngModelCtrl.$viewValue
//
// otValueChanged
//   ngModelSet(scope, incomingValue)

angular.module('contentful').directive('cfFieldEditor', [function() {
  return {
    restrict: 'C',
    require: '^otPath',
    template: JST['cf_field_editor'](),
    controller: 'CfFieldEditorController',
  };
}]);
