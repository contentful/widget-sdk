import { registerDirective, registerController } from 'NgRegistry.es6';
import accountDropdownTemplateDef from 'navigation/templates/AccountDropdown.template.es6';
import * as Intercom from 'services/intercom.es6';

import * as Analytics from 'analytics/Analytics.es6';
import * as Config from 'Config.es6';
import * as Authentication from 'Authentication.es6';

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
    ($scope, $state) => {
      $scope.userProfileRef = {
        path: ['account', 'profile', 'user'],
        options: { reload: true }
      };

      $scope.supportUrl = Config.supportUrl;
      $scope.isIntercomEnabled = Intercom.isEnabled;
      $scope.logout = logout;
      $scope.talkToUsClicked = () => {
        Analytics.track('element:click', {
          elementId: 'contact_sales_dropdown',
          groupId: 'contact_sales',
          fromState: $state.current.name
        });
        Intercom.open();
      };

      function logout() {
        Analytics.track('global:logout_clicked');
        Analytics.disable();
        Authentication.logout();
      }
    }
  ]);
}
