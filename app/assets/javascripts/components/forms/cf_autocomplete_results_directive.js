'use strict';

angular.module('contentful').directive('cfAutocompleteResults', function (keycodes) {
  return {
    controller: 'CfAutocompleteResultsCtrl',
    controllerAs: 'resultsController',
    link: function (scope, elem) {
      var navigateResultList = function navigateResultList(event) {
        var handled;
        scope.$apply(function () {
          if (scope.searchController.isEmptyState()) {
            handled = handleEmptyList();
          } else if (scope.resultsController.numResults > 0) {
            handled = handleFullList(event);
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
      

      function handleFullList(event) {
        var handled = true;
        if (event.keyCode == keycodes.DOWN){
          scope.resultsController.selectNext();
        } else if (event.keyCode == keycodes.UP) {
          scope.resultsController.selectPrevious();
        } else if (event.keyCode == keycodes.ESC) {
          scope.resultsController.cancelAutocomplete();
        } else if (event.keyCode == keycodes.ENTER) {
          scope.resultsController.pickSelected();
        } else {
          handled = false;
        }
        return handled;
      }

      function handleEmptyList() {
        scope.resultsController.cancelAutocomplete();
        return true;
      }
    }
  };
});
