'use strict';

angular.module('contentful').directive('cfSelectAllInput', function() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      function clickHandler() {
        element.get(0).setSelectionRange(0, element.val().length);
      }
      element.on('click', clickHandler);

      element.on('$destroy', function () {
        element.off('click', clickHandler);
      });
    }
  };
});
