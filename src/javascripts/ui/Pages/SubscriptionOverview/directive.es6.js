import { registerDirective } from 'NgRegistry.es6';
import React from 'react';
import ReactDOM from 'react-dom';

export default function register() {
  registerDirective('cfSubscriptionOverview', [
    'ui/Pages/SubscriptionOverview',
    ({ default: SubscriptionOverview }) => ({
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
    })
  ]);
}
