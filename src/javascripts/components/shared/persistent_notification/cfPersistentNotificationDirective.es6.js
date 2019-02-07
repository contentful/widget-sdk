import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import * as logger from 'services/logger.es6';

export default function register() {
  registerDirective('cfPersistentNotification', [
    '$sce',
    '$timeout',
    ($sce, $timeout) => {
      return {
        restrict: 'E',
        template: JST.cf_persistent_notification(),
        link: link
      };

      function link(scope) {
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
        scope.$on('persistentNotification', (_ev, params) => {
          dismissed = false;
          if (!notificationsOfCycle.length) {
            $timeout(updateNotificationForCycle, 0);
          }
          notificationsOfCycle.push(params);
        });

        scope.$on('resetPersistentNotification', () => {
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
          scope.persistentNotification = true;
          _.assign(scope, params);
          const message = params.message;
          scope.message = message && $sce.trustAsHtml(message);
        }

        function resetNotification() {
          scope.message = null;
          scope.action = null;
          scope.actionMessage = null;
          scope.persistentNotification = null;
        }
      }

      function logConcurrentNotifications(notifications) {
        notifications = notifications.map(params => params || '*RESET NOTIFICATION*');
        logger.logWarn('Concurrent persistent notifications', {
          notifications: notifications
        });
      }
    }
  ]);
}
