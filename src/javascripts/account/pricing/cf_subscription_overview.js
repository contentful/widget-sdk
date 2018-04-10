'use strict';

angular.module('contentful')
.directive('cfSubscriptionOverview', ['require', function (require) {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var SubscriptionOverview = require('account/pricing/SubscriptionOverview').default;

  return {
    link: function ($scope, el) {
      var host = el[0];
      var context = $scope.properties.context;

      ReactDOM.render(React.createElement(SubscriptionOverview, {
        orgId: $scope.properties.orgId,
        onReady: function () { context.ready = true; $scope.$apply(); },
        onForbidden: function () { context.forbidden = true; $scope.$apply(); }
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
