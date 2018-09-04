'use strict';

angular.module('contentful').directive('cfPlatformUsage', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const OrganizationUsage = require('account/usage/OrganizationUsage.es6').default;

    return {
      link: function($scope, el) {
        const host = el[0];
        const context = $scope.properties.context;

        ReactDOM.render(
          React.createElement(OrganizationUsage, {
            orgId: $scope.properties.orgId,
            onReady: function() {
              context.ready = true;
            },
            onForbidden: function() {
              context.forbidden = true;
            }
          }),
          host
        );

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(host);
        });
      }
    };
  }
]);
