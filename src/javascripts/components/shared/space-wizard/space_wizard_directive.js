'use strict';

angular.module('contentful')
.directive('cfSpaceWizard', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Wizard = require('components/shared/space-wizard/Wizard').default;
  var store = require('components/shared/space-wizard/store').store;
  var $state = require('$state');
  var $rootScope = require('$rootScope');

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(Wizard, {
        action: $scope.action,
        space: $scope.space,
        limitReached: $scope.limitReached,
        organization: $scope.organization,
        store,
        onCancel: function () { $scope.dialog.cancel(); },
        onConfirm: function () {
          if ($scope.onSubmit) {
            $scope.onSubmit().then(() => {
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

      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(host);

        // Reset the store so that it has fresh state next opening
        store.dispatch({ type: 'SPACE_WIZARD_RESET' });
      });
    }
  };
}]);
