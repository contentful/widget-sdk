'use strict';

angular.module('contentful').directive('cfAutocompleteResults', function (keycodes) {
  return {
    require: 'cfAutocompleteResults',
    controller: 'CfAutocompleteResultsCtrl',
    link: function (scope, elem, attrs, controller) {
      var navigateResultList = function navigateResultList(event) {
        if (controller.numResults === 0) return;
        var handled = true;
        scope.$apply(function () {
          if (event.keyCode == keycodes.DOWN){
            controller.selectNext();
          } else if (event.keyCode == keycodes.UP) {
            controller.selectPrevious();
          } else if (event.keyCode == keycodes.ESC) {
            controller.cancelAutocomplete();
          } else if (event.keyCode == keycodes.ENTER) {
            controller.pickSelected();
          } else {
            handled = false;
          }
        });
        if (handled) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
      elem.on('keydown', navigateResultList);

      scope.$on('$destroy', function () {
        elem.off('keydown', navigateResultList);
        navigateResultList = null;
      });
      
    }
  };
});
