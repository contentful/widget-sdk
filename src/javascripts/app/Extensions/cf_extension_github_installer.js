'use strict';

angular.module('contentful')
.directive('cfExtensionGithubInstaller', ['require', function (require) {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var GitHubInstaller = require('app/Extensions/GitHubInstaller').default;

  return {
    restrict: 'E',
    template: '<div class="mount-point"></div>',
    scope: true,
    link: function (scope, el) {
      ReactDOM.render(
        React.createElement(GitHubInstaller, {
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
