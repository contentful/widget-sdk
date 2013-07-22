'use strict';

angular.module('contentful').directive('validationErrorDisplay', function () {
  return {
    restrict: 'C',
    template: JST['validation_error_display'],
    scope: true,
    link: function (scope, elem, attrs) {
      scope.$watch('errorMessages.length', function (numErrors) {
        if (0 < numErrors) {
          scope.noErrors = false;
          scope.hasErrors = true;
          if (attrs['ngHide'] || attrs['ngShow']) return;
          elem.show();
        } else {
          scope.noErrors = true;
          scope.hasErrors = false;
          if (attrs['ngHide'] || attrs['ngShow']) return;
          elem.hide();
        }
      });
    },
    controller: 'ValidationErrorDisplayCtrl'
  };
});
