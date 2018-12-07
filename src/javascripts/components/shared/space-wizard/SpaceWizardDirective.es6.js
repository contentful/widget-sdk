import { registerDirective } from 'NgRegistry.es6';

registerDirective('cfSpaceWizard', [
  '$state',
  '$rootScope',
  'ReduxStore/store.es6',
  'components/shared/space-wizard/store/actionCreators.es6',
  ($state, $rootScope, { default: ReduxStore }, actionCreators) => {
    const { reset: resetActionCreator } = actionCreators;
    return {
      link: function($scope) {
        $scope.props = {
          action: $scope.action,
          space: $scope.space,
          wizardScope: $scope.scope,
          organization: $scope.organization,
          onCancel: function() {
            $scope.dialog.cancel();
          },
          onConfirm: function() {
            if ($scope.onSubmit) {
              $scope.onSubmit().then(() => {
                $scope.dialog.confirm();
              });
            } else {
              $scope.dialog.confirm();
            }
          },
          onSpaceCreated: function(newSpace) {
            $state.go('spaces.detail', { spaceId: newSpace.sys.id });
          },
          onTemplateCreated: function() {
            // Picked up by the learn page which then refreshes itself
            $rootScope.$broadcast('spaceTemplateCreated');
          },
          onDimensionsChange: function() {
            $scope.dialog.reposition();
          }
        };

        $scope.onScopeDestroy = function({ unmountComponent }) {
          unmountComponent();

          ReduxStore.dispatch(resetActionCreator());
        };
      },
      template: `<react-component
      name="components/shared/space-wizard/Wizard.es6"
      props="props"
      on-scope-destroy="onScopeDestroy"
      watch-depth="reference"
    ></react-component>`
    };
  }
]);
