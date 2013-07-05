'use strict';

// Fixes ngModelControllers behavior in the way that changes to the model value that are
// angular.equal but not === equal are not treated as changes.
// This way, replacing an object with an equal object will not result in the models view value being
// overwritten.
angular.module('contentful').directive('cfListIdentityFix', function () {
  return {
    require: ['ngModel', 'cfListIdentityFix'],
    priority: 100,
    controller: function ($scope, $attrs, $parse) {
      var ngModelGet = $parse($attrs.ngModel);
      var ctrl = this;

      $scope.$watch(function (scope) {
        if (!ctrl.ngModelCtrl) return;
        var newModelValue = ngModelGet(scope);
        var oldModelValue = ctrl.ngModelCtrl.$modelValue;

        if (oldModelValue !== newModelValue && angular.equals(oldModelValue, newModelValue)) {
          ctrl.ngModelCtrl.$modelValue = newModelValue;
        }
      });

      $scope.$on('$destroy', function () {
        ctrl.ngModelCtrl = null;
      });
    },
    link: function (scope, elem, attr, controllers) {
      var ngModelCtrl = controllers[0];
      var fixCtrl     = controllers[1];

      fixCtrl.ngModelCtrl = ngModelCtrl;
    }
  };
});
