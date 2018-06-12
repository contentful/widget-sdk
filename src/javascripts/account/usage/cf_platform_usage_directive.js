'use strict';

angular.module('contentful')
.directive('cfPlatformUsage', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var OrganizationUsage = require('account/usage/OrganizationUsage').default;

  return {
    link: function ($scope, el) {
      var host = el[0];
      var context = $scope.properties.context;

      ReactDOM.render(React.createElement(OrganizationUsage, {
        orgId: $scope.properties.orgId,
        onReady: function () { context.ready = true; },
        onForbidden: function () { context.forbidden = true; }
      }), host);

      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
