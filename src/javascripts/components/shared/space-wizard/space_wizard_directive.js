'use strict';

angular.module('contentful')
.directive('cfSpaceWizard', ['require', require => {
  var $state = require('$state');
  var $rootScope = require('$rootScope');
  var WizardStore = require('components/shared/space-wizard/store');
  var store = WizardStore.default;
  var actionCreators = WizardStore.actionCreators;

  return {
    link: function ($scope) {
      $scope.props = {
        action: $scope.action,
        space: $scope.space,
        limitReached: $scope.limitReached,
        organization: $scope.organization,
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
      };

      $scope.onScopeDestroy = function ({ unmountComponent }) {
        unmountComponent();

        store.dispatch(actionCreators.reset());
      };
    },
    template: `<react-component
      name="components/shared/space-wizard/Wizard"
      props="props"
      on-scope-destroy="onScopeDestroy"
      watch-depth="reference"
    ></react-component>`
  };
}]);
