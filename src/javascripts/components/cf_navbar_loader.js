'use strict';

angular.module('contentful').directive('cfNavbarLoader', ['cfSpinner', function (cfSpinner) {
  return {
    restrict: 'A',
    template: '<div class="app-top-bar__loader"></div>',
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

