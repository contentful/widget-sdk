'use strict';

angular.module('contentful').directive('navbarLoader', ['cfSpinner', function (cfSpinner) {
  return {
    restrict: 'C',
    link: function (scope, element) {
      element.hide();
      cfSpinner.setCallback(function (state) {
        if (state) {
          element.show();
        } else {
          element.hide();
        }
      });
    }
  };
}]);

