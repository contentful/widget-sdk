import { registerDirective } from 'NgRegistry';

import * as actionCreators from 'redux/actions/spaceWizard/actionCreators';
import * as Analytics from 'analytics/Analytics';
import ReduxStore from 'redux/store';

export default function register() {
  registerDirective('cfSpaceWizard', [
    '$state',
    '$rootScope',
    ($state, $rootScope) => {
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
            onConfirm: function(productRatePlanId) {
              if ($scope.onSubmit) {
                $scope.onSubmit(productRatePlanId).then(() => {
                  $scope.dialog.confirm();
                });
              } else {
                $scope.dialog.confirm();
              }
            },
            onSpaceCreated: async function(newSpace, template) {
              await $state.go('spaces.detail', { spaceId: newSpace.sys.id });

              const spaceCreateEventData = template
                ? {
                    templateName: template.name,
                    entityAutomationScope: { scope: 'space_template' }
                  }
                : { templateName: 'Blank' };

              Analytics.track('space:create', spaceCreateEventData);
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
      name="components/shared/space-wizard/Wizard"
      props="props"
      on-scope-destroy="onScopeDestroy"
      watch-depth="reference"
    ></react-component>`
      };
    }
  ]);
}
