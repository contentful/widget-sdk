'use strict';

angular.module('contentful')
.directive('cfSubscriptionOverview', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var SubscriptionOverview = require('ui/Pages/SubscriptionOverview').default;

  return {
    link: function ($scope, el) {
      var host = el[0];
      var context = $scope.properties.context;

      ReactDOM.render(React.createElement(SubscriptionOverview, {
        orgId: $scope.properties.orgId,
        onReady: function () { context.ready = true; $scope.$applyAsync(); },
        onForbidden: function () { context.forbidden = true; $scope.$applyAsync(); }
      }), host);

      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
