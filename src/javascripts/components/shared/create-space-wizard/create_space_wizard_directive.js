'use strict';

angular.module('contentful')
.directive('cfCreateSpaceWizard', ['require', function (require) {
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var Wizard = require('components/shared/create-space-wizard/Wizard').default;
  var $state = require('$state');
  var $rootScope = require('$rootScope');

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(Wizard, {
        orgId: $scope.organizationId,
        cancel: function () { $scope.dialog.cancel(); },
        onSpaceCreated: function (newSpace) {
          $scope.dialog.confirm();
          $state.go('spaces.detail', {spaceId: newSpace.sys.id});
        },
        onTemplateCreated: function () {
          // Picked up by the learn page which then refreshes itself
          $rootScope.$broadcast('spaceTemplateCreated');
        }
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
