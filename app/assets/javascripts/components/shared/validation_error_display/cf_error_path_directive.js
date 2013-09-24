'use strict';

angular.module('contentful').directive('cfErrorPath', function () {
  return {
    scope: true,
    controller: 'ErrorPathController',
    require: 'cfErrorPath',
    link: function (scope, elem, attrs, errorPathController) {
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
    }
  };
});
