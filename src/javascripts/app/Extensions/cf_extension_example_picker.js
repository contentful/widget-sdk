'use strict';

angular.module('contentful').directive('cfExtensionExamplePicker', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const ExamplePicker = require('app/Extensions/ExamplePicker').default;

    return {
      restrict: 'E',
      template: '<div class="mount-point"></div>',
      scope: true,
      link: function(scope, el) {
        ReactDOM.render(
          React.createElement(ExamplePicker, {
            // `scope.dialog` may not be available right away so we
            // pass wrapped invocations down.
            onConfirm: function(value) {
              scope.dialog.confirm(value);
            },
            onCancel: function(err) {
              scope.dialog.cancel(err instanceof Error ? err : { cancelled: true });
            }
          }),
          el[0].querySelector('.mount-point')
        );
      }
    };
  }
]);
