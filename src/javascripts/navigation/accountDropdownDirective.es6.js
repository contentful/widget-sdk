import { registerDirective, registerController } from 'NgRegistry.es6';
import { getCurrentStateName } from 'states/Navigator.es6';
import accountDropdownTemplateDef from 'navigation/templates/AccountDropdown.template.es6';

export default function register() {
  registerDirective('cfAccountDropdown', () => ({
    template: accountDropdownTemplateDef(),
    restrict: 'E',
    scope: { user: '=' },
    controller: 'cfAccountDropdownController'
  }));

  registerController('cfAccountDropdownController', [
    '$scope',
    $scope => {
      let Intercom;
      let Analytics;
      let Config;
      let Authentication;

      $scope.loaded = false;

      initialize().then(() => {
        $scope.supportUrl = Config.supportUrl;
        $scope.isIntercomEnabled = Intercom.isEnabled;

        $scope.loaded = true;
      });

      $scope.userProfileRef = {
        path: ['account', 'profile', 'user'],
        options: { reload: true }
      };

      $scope.logout = logout;
      $scope.talkToUsClicked = () => {
        Analytics.track('element:click', {
          elementId: 'contact_sales_dropdown',
          groupId: 'contact_sales',
          fromState: getCurrentStateName()
        });
        Intercom.open();
      };

      async function initialize() {
        [Intercom, Analytics, Config, Authentication] = await Promise.all([
          import('services/intercom.es6'),
          import('analytics/Analytics.es6'),
          import('Config.es6'),
          import('Authentication.es6')
        ]);
      }

      function logout() {
        Analytics.track('global:logout_clicked');
        Analytics.disable();
        Authentication.logout();
      }
    }
  ]);
}
