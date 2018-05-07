'use strict';

angular.module('contentful')
.directive('cfExtensionSamplePicker', ['require', function (require) {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var SamplePicker = require('app/Extensions/SamplePicker').default;

  return {
    restrict: 'E',
    template: '<div class="mount-point"></div>',
    scope: true,
    link: function (scope, el) {
      ReactDOM.render(
        React.createElement(SamplePicker, {
          // `scope.dialog` may not be available right away so we
          // pass wrapped invocations down.
          confirm: function (value) { scope.dialog.confirm(value); },
          cancel: function () { scope.dialog.cancel({cancelled: true}); }
        }),
        el[0].querySelector('.mount-point')
      );
    }
  };
}]);
