import { registerDirective, registerController } from 'NgRegistry.es6';
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
    '$state',
    'intercom',
    'Authentication.es6',
    'Config.es6',
    'analytics/Analytics.es6',
    ($scope, $state, intercom, Authentication, Config, Analytics) => {
      $scope.userProfileRef = {
        path: ['account', 'profile', 'user'],
        options: { reload: true }
      };

      $scope.supportUrl = Config.supportUrl;
      $scope.isIntercomLoaded = intercom.isLoaded;
      $scope.logout = logout;
      $scope.talkToUsClicked = () => {
        Analytics.track('element:click', {
          elementId: 'contact_sales_dropdown',
          groupId: 'contact_sales',
          fromState: $state.current.name
        });
        intercom.open();
      };

      function logout() {
        Analytics.track('global:logout_clicked');
        Analytics.disable();
        Authentication.logout();
      }
    }
  ]);
}
