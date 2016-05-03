'use strict';
/**
 * @ngdoc directive
 * @name cfCopyToClipboard
 * @description
 *
 * Directive that adds inline copy to clipboard functionality for all browsers
 * except Safari. Creates a link with a `Copy to clipboard` tooltip and displays a
 * tick for 1.5 seconds after being copied.
 *
 * @usage[html]
 * <cf-inline-copy text="text to be copied" />
 *
 * TODO: should use transclusion
 * e.g. <cf-inline-copy>text to be copied</cf-inline-copy>
 *
 */
angular.module('contentful')
.directive('cfInlineCopy', ['$injector', function ($injector) {

  var $document = $injector.get('$document');
  var $timeout = $injector.get('$timeout');
  var userAgent = $injector.get('userAgent');
  var timeout;

  return {
    restrict: 'E',
    template: JST.cf_inline_copy_directive(),
    scope: true,
    link: function (scope, elem, attrs) {

      scope.text = attrs.text;

      scope.showCopy = !userAgent.isSafari();

      scope.copyToClipboard = copyToClipboard;

      scope.$on('$destroy', function () {
        if (timeout) {
          $timeout.cancel(timeout);
        }
      });

      function copyToClipboard () {
        // create element, copy content and remove it
        var tmp = $('<input>').attr({
          type: 'text',
          value: scope.text
        }).appendTo(elem).select();

        $document[0].execCommand('copy', false, null);

        tmp.remove();

        scope.showCopySuccess = true;

        timeout = $timeout(function () {
          scope.showCopySuccess = false;
        }, 1500);
      }
    }
  };
}]);
