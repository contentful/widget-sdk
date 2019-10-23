import { registerDirective, registerController } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfAccountDropdown', () => ({
    template: '<react-component name="navigation/templates/AccountDropdown.es6" props="props" />',
    restrict: 'E',
    scope: { user: '=' },
    controller: 'cfAccountDropdownController'
  }));

  registerController('cfAccountDropdownController', [
    '$scope',
    $scope => {
      console.log($scope);

      $scope.props = {
        firstName: '$scope.user.firstName',
        lastName: '$scope.user.lastName',
        email: '$scope.user.email',
        avatarUrl: '$scope.user.avatarUrl'
      };
    }
  ]);
}
