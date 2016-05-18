'use strict';

angular.module('cf.ui')

/**
 * @ngdoc directive
 * @name ui-hide-on-click
 * @module cf.ui
 * @description
 * Adds an event handler to the DOM document that will hide the element
 * on any click.
 *
 * It uses the JQuery `element.hide()` method to hide the element. To
 * show it again you need to call `element.show()`.
 */
.directive('uiHideOnClick', ['$injector', function ($injector) {
  var $document = $injector.get('$document');
  return {
    restrict: 'A',
    link: function (_scope, element) {
      $document.on('click', hideElement);

      element.on('$destroy', function () {
        $document.off('click', hideElement);
      });

      function hideElement () {
        element.hide();
      }
    }
  };
}]);
