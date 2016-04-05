'use strict';
/**
 * @ngdoc directive
 * @name cfCopyToClipboard
 * @description
 *
 * Directive that adds a copy to clipboard button to a form input for all browsers
 * except Safari. It should have a `text` attribute that provides the text that is
 * to be copied to the clipboard.
 *
 * @usage[html]
 * <cf-copy-to-clipboard text="text to be copied" />
 */
angular.module('contentful')
.directive('cfCopyToClipboard', ['$injector', function ($injector) {

  var $document   = $injector.get('$document');
  var $timeout    = $injector.get('$timeout');
  var userAgent   = $injector.get('userAgent');

  return {
    restrict: 'E',
    scope: true,
    template: '<button class="cfnext-form__icon-suffix fa {{icon}} ' +
              'copy-to-clipboard" tooltip="Copy to clipboard"></button>',
    link: function (scope, elem, attrs) {

      scope.showCopy = !userAgent.isSafari();

      scope.icon = 'fa-copy';

      if (scope.showCopy) {
        elem.on('click', copyToClipboard);
      }

      function copyToClipboard() {
        // create element, copy content and remove it
        var tmp = $('<input>').attr({
          type: 'text',
          value: attrs.text
        }).appendTo(elem).select();

        $document[0].execCommand('copy', false, null);

        tmp.remove();

        // show tick for 1.5 seconds
        scope.icon = 'fa-check';
        $timeout(function() {
          scope.icon = 'fa-copy';
        }, 1500);

      }
    }
  };
}]);
