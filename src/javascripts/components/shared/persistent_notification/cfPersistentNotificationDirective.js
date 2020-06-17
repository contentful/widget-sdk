import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import PersistentNotification from 'components/persistent-notification/PersistentNotification';

export default function register() {
  registerDirective('cfPersistentNotification', [
    '$timeout',
    ($timeout) => {
      return {
        restrict: 'E',
        template: '<react-component component="component" props="props"></react-component>',
        controller: ['$scope', controller],
      };

      function controller($scope) {
        $scope.component = PersistentNotification;
        $scope.props = {};

        /**
         * Contains what was broadcasted with all `persistentNotification` events during
         * the same digestion cycle. At the end of the cycle we
         * - remove the notification bar if this array only contains `null` objects.
         * - display the first notification parameters object's notification.
         * - log multiple concurrently broadcasted notification parameter objects.
         * - empty the array.
         * @type {Array<object|null>}
         */
        let notificationsOfCycle = [];
        let dismissed;

        resetNotification();

        // TODO: Introduce a service with full control over a notification's
        //  lifecycle instead of abusing broadcast.
        $scope.$on('persistentNotification', (_, params) => {
          dismissed = false;
          if (!notificationsOfCycle.length) {
            $timeout(updateNotificationForCycle, 0);
          }
          notificationsOfCycle.push(params);
        });

        $scope.$on('resetPersistentNotification', () => {
          dismissed = true;
          resetNotification();
        });

        function updateNotificationForCycle() {
          const actualNotifications = _.filter(notificationsOfCycle);
          const includesReset = actualNotifications.length < notificationsOfCycle.length;

          if (actualNotifications.length) {
            setNotification(actualNotifications[0]);
            if (actualNotifications.length > 1) {
              logConcurrentNotifications(notificationsOfCycle);
            }
          } else if (includesReset) {
            resetNotification();
          }
          notificationsOfCycle = [];
        }

        function setNotification(params) {
          if (dismissed) {
            return;
          }
          resetNotification();

          $scope.persistentNotification = true;

          $scope.props = {
            contents: params.message,
            linkUrl: params.link?.href,
            linkText: params.link?.text,
            actionMessage: params.actionMessage,
            onClickAction: params.action,
          };
        }

        function resetNotification() {
          $scope.props = {};
        }

        async function logConcurrentNotifications(notifications) {
          notifications = notifications.map((params) => params || '*RESET NOTIFICATION*');
          (await import('services/logger')).logWarn('Concurrent persistent notifications', {
            notifications: notifications,
          });
        }
      }
    },
  ]);
}
