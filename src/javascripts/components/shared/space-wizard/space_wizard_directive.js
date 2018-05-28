'use strict';

angular.module('contentful')
.directive('cfSpaceWizard', ['require', function (require) {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Wizard = require('components/shared/space-wizard/Wizard').default;
  var $state = require('$state');
  var $rootScope = require('$rootScope');

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(Wizard, {
        action: $scope.action,
        space: $scope.space,
        organization: $scope.organization,
        onCancel: function () { $scope.dialog.cancel(); },
        onConfirm: function () {
          if ($scope.onSubmit) {
            $scope.onSubmit().then(function () {
              $scope.dialog.confirm();
            });
          } else {
            $scope.dialog.confirm();
          }
        },
        onSpaceCreated: function (newSpace) {
          $state.go('spaces.detail', {spaceId: newSpace.sys.id});
        },
        onTemplateCreated: function () {
          // Picked up by the learn page which then refreshes itself
          $rootScope.$broadcast('spaceTemplateCreated');
        },
        onDimensionsChange: function () {
          $scope.dialog.reposition();
        }
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
