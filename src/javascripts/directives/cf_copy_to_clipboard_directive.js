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
.directive('cfCopyToClipboard', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var $timeout = require('$timeout');
  var userAgent = require('userAgent');
  var domCopy = require('utils/DomClipboardCopy').default;

  var template = h('button', {
    class: [
      'cfnext-form__icon-suffix',
      'copy-to-clipboard', 'x--input-suffix',
      'fa', '{{icon}}'
    ].join(' '),
    tooltip: 'Copy to clipboard'
  });

  return {
    restrict: 'E',
    scope: true,
    template: template,
    link: function (scope, elem, attrs) {
      var canCopy = !userAgent.isSafari();

      scope.icon = 'fa-copy';

      if (canCopy) {
        elem.on('click', copyToClipboard);
      } else {
        elem.css({display: 'none'});
      }

      function copyToClipboard () {
        domCopy(attrs.text);

        // show tick for 1.5 seconds
        scope.$apply(function () {
          scope.icon = 'fa-check';
        });
        $timeout(function () {
          scope.icon = 'fa-copy';
        }, 1500);
      }
    }
  };
}]);
