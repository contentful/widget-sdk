'use strict';

angular.module('contentful')
.directive('cfSpacePlans', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var SpacePlans = require('account/pricing/SpacePlans').default;

  return {
    link: function ($scope, el) {
      var host = el[0];
      var context = $scope.properties.context;

      ReactDOM.render(React.createElement(SpacePlans, {
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
