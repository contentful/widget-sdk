'use strict';

angular.module('contentful')
.directive('cfCreateSpaceWizard', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var Wizard = require('components/shared/create-space-wizard/Wizard').default;

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(Wizard, {
        orgId: $scope.organizationId,
        cancel: function () { $scope.dialog.cancel(); },
        confirm: function () { $scope.dialog.confirm(); }
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
