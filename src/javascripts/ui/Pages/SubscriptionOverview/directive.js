'use strict';

angular.module('contentful').directive('cfSubscriptionOverview', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const SubscriptionOverview = require('ui/Pages/SubscriptionOverview').default;

    return {
      link: function($scope, el) {
        const host = el[0];
        const context = $scope.properties.context;

        ReactDOM.render(
          <SubscriptionOverview
            orgId={$scope.properties.orgId}
            onReady={function() {
              context.ready = true;
              $scope.$applyAsync();
            }}
            onForbidden={function() {
              context.forbidden = true;
              $scope.$applyAsync();
            }}
          />,
          host
        );

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(host);
        });
      }
    };
  }
]);
