'use strict';

angular.module('contentful')
.directive('cfPersistentNotification', ['require', function (require) {
  var $sce = require('$sce');
  var $timeout = require('$timeout');
  var Analytics = require('analytics/Analytics');
  var logger = require('logger');

  return {
    restrict: 'E',
    template: JST.cf_persistent_notification(),
    link: link
  };

  function link (scope) {
    /**
     * Contains what was broadcasted with all `persistentNotification` events during
     * the same digestion cycle. At the end of the cycle we
     * - remove the notification bar if this array only contains `null` objects.
     * - display the first notification parameters object's notification.
     * - log multiple concurrently broadcasted notification parameter objects.
     * - empty the array.
     * @type {Array<object|null>}
     */
    var notificationsOfCycle = [];
    var dismissed;

    resetNotification();

    scope.dismissPersistentNotification = function () {
      Analytics.track('global:top_banner_dismissed');
      dismissed = true;
      resetNotification();
    };

    // TODO: Introduce a service with full control over a notification's
    //  lifecycle instead of abusing broadcast.
    scope.$on('persistentNotification', function (_ev, params) {
      if (!notificationsOfCycle.length) {
        $timeout(updateNotificationForCycle, 0);
      }
      notificationsOfCycle.push(params);
    });

    function updateNotificationForCycle () {
      var actualNotifications = _.filter(notificationsOfCycle);
      var includesReset = actualNotifications.length < notificationsOfCycle.length;

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

    function setNotification (params) {
      if (dismissed) {
        return;
      }
      resetNotification();
      scope.persistentNotification = true;
      _.assign(scope, params);
      var message = params.message;
      scope.message = message && $sce.trustAsHtml(message);
    }

    function resetNotification () {
      scope.message = null;
      scope.action = null;
      scope.actionMessage = null;
      scope.persistentNotification = null;
    }
  }

  function logConcurrentNotifications (notifications) {
    notifications = notifications.map(function (params) {
      return params || '*RESET NOTIFICATION*';
    });
    logger.logWarn('Concurrent persistent notifications', {
      notifications: notifications
    });
  }
}]);
