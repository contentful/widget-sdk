'use strict';

angular.module('contentful')
.directive('cfPlatformUsage', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var PlatformUsage = require('account/usage/PlatformUsage').default;

  return {
    link: function ($scope, el) {
      var host = el[0];
      var context = $scope.properties.context;

      ReactDOM.render(React.createElement(PlatformUsage, {
        orgId: $scope.properties.orgId,
        onReady: function () { context.ready = true; },
        onForbidden: function () { context.forbidden = true; }
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
