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
angular.module('contentful').directive('cfCopyToClipboard', [
  'require',
  require => {
    const h = require('utils/hyperscript').h;
    const $timeout = require('$timeout');
    const userAgent = require('userAgent');
    const domCopy = require('utils/DomClipboardCopy.es6').default;

    const template = h('button', {
      class: [
        'cfnext-form__icon-suffix',
        'copy-to-clipboard',
        'x--input-suffix',
        'fa',
        '{{icon}}'
      ].join(' '),
      tooltip: 'Copy to clipboard'
    });

    return {
      restrict: 'E',
      scope: true,
      template: template,
      link: function(scope, elem, attrs) {
        const canCopy = !userAgent.isSafari();

        scope.icon = 'fa-copy';

        if (canCopy) {
          elem.on('click', copyToClipboard);
        } else {
          elem.css({ display: 'none' });
        }

        function copyToClipboard() {
          domCopy(attrs.text);

          // show tick for 1.5 seconds
          scope.$apply(() => {
            scope.icon = 'fa-check';
          });
          $timeout(() => {
            scope.icon = 'fa-copy';
          }, 1500);
        }
      }
    };
  }
]);
