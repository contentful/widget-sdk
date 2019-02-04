import { registerDirective } from 'NgRegistry.es6';
import appContainerTemplateDef from 'components/app_container/AppContainer.es6';

export default function register() {
  registerDirective('cfAppContainer', () => ({
    template: appContainerTemplateDef(),
    restrict: 'E',
    controller: [
      '$scope',
      function($scope) {
        $scope.sidePanelIsShown = false;
        $scope.toggleSidePanel = () => {
          $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
          $scope.$applyAsync();
        };
      }
    ]
  }));
}
