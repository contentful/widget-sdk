import { registerDirective } from 'core/NgRegistry';
import { PersistentNotification } from 'components/shared/persistent-notification/PersistentNotification';

export default function register() {
  registerDirective('cfAppContainer', () => ({
    template: `
      <react-component component="persistentNotificationComponent"></react-component>
      <div ui-view="nav-bar"></div>
      <div ui-view="content" class="app-container__content"></div>
    `,
    restrict: 'E',
    controller: [
      '$scope',
      function ($scope) {
        $scope.switchingSpaceContext = false;

        $scope.persistentNotificationComponent = PersistentNotification;
      },
    ],
  }));
}
