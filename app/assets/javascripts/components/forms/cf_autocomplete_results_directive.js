'use strict';

angular.module('contentful').directive('cfAutocompleteResults', function (keycodes) {
  return {
    controller: 'CfAutocompleteResultsCtrl',
    controllerAs: 'resultsController',
    link: function (scope, elem) {
      var navigateResultList = function navigateResultList(event) {
        var handled;
        scope.$apply(function () {
          if (event.keyCode == keycodes.DOWN){
            handled = scope.resultsController.selectNext();
          } else if (event.keyCode == keycodes.UP) {
            handled = scope.resultsController.selectPrevious();
          } else if (event.keyCode == keycodes.ESC) {
            handled = scope.resultsController.cancelAutocomplete();
          } else if (event.keyCode == keycodes.ENTER) {
            handled = scope.resultsController.pickSelected();
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
