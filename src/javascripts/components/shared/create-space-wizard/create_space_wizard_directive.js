'use strict';

angular.module('contentful')
.directive('cfCreateSpaceWizard', ['require', function (require) {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Wizard = require('components/shared/create-space-wizard/Wizard').default;
  var $state = require('$state');
  var $rootScope = require('$rootScope');
  var debounce = require('lodash').debounce;

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(Wizard, {
        organization: $scope.organization,
        onCancel: function () { $scope.dialog.cancel(); },
        onConfirm: function () { $scope.dialog.confirm(); },
        onSpaceCreated: function (newSpace) {
          $state.go('spaces.detail', {spaceId: newSpace.sys.id});
        },
        onTemplateCreated: function () {
          // Picked up by the learn page which then refreshes itself
          $rootScope.$broadcast('spaceTemplateCreated');
        },
        onDimensionsChange: debounce(function () {
          $scope.dialog.reposition();
        }, 100)
      }), host);

      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
