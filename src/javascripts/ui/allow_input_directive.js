'use strict';

angular.module('cf.ui')
/**
 * @ngdoc directive
 * @module cf.ui
 * @name uiAllowInput
 * @description
 * Prevent the user from inputing invalid characters.
 *
 * The set of valid characters is given as the attribute value. It is
 * converted into a Regular Expression by enclsing it in brackets `[...]`.
 * @usage[jade]
 * // Allow only lower case letters, dashes, and spaces
 * input(type="text ui-allow-input="a-z- ")
 */
.directive('uiAllowInput', [function () {
  return {
    restrict: 'A',
    link: function (_$scope, $el) {
      if ($el.get(0).tagName !== 'INPUT') {
        throw new Error('The "uiKeyInputReject" directive must be used on an "input" element');
      }

      $el.on('keypress', function (ev) {
        // We cannot use the '$attrs' argument because it strips whitespaces
        var re = new RegExp('[' + $el.attr('ui-allow-input') + ']');
        if (!re.test(String.fromCharCode(ev.charCode))) {
          ev.preventDefault();
        }
      });
    }
  };
}]);
