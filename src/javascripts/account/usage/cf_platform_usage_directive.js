'use strict';

angular.module('contentful')
.directive('cfPlatformUsage', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var PlatformUsage = require('account/usage/PlatformUsage').PlatformUsage;

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(PlatformUsage, {
        context: $scope.properties.context,
        orgId: $scope.properties.orgId
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  }
}]);
