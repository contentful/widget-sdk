'use strict';

angular.module('contentful').directive('cfAutocompleteResults', function ($parse) {
  var DOWN  = 40,
      UP    = 38,
      ENTER = 13,
      ESC   = 27;

  return {
    require: 'cfAutocompleteResults',
    controller: 'CfAutocompleteResultsCtrl',
    link: function (scope, elem, attrs, controller) {
      controller.getAutocompleteResults = $parse(attrs.cfAutocompleteResults);
      controller.setAutocompleteTerm = $parse(attrs.autocompleteTerm).assign;

      var navigateResultList = function navigateResultList(event) {
        if (controller.numResults === 0) return;
        var handled = true;
        scope.$apply(function () {
          if (event.keyCode == DOWN){
            controller.selectNext();
          } else if (event.keyCode == UP) {
            controller.selectPrevious();
          } else if (event.keyCode == ESC) {
            controller.cancelAutocomplete();
          } else if (event.keyCode == ENTER) {
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
