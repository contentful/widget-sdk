import { registerDirective } from 'NgRegistry.es6';
import keycodes from 'utils/keycodes.es6';

registerDirective('cfAutocompleteResults', () => ({
  controller: 'CfAutocompleteResultsController',
  controllerAs: 'resultsController',
  restrict: 'A',
  link: function(scope, elem) {
    let navigateResultList = function navigateResultList(event) {
      let handled;
      scope.$apply(() => {
        if (event.keyCode === keycodes.DOWN) {
          handled = scope.resultsController.selectNext();
        } else if (event.keyCode === keycodes.UP) {
          handled = scope.resultsController.selectPrevious();
        } else if (event.keyCode === keycodes.ESC) {
          handled = scope.resultsController.cancelAutocomplete();
        } else if (event.keyCode === keycodes.ENTER) {
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
    elem[0].addEventListener('keydown', navigateResultList, true);

    scope.$on('$destroy', () => {
      elem[0].removeEventListener('keydown', navigateResultList, true);
      navigateResultList = null;
      scope = null; // MEMLEAK FIX
    });
  }
}));
