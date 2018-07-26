angular.module('contentful')

.config(['$provide', $provide => {
  $provide.constant('notification/CLEAR_TIMEOUT_MS', 6000);

  // This should be aligned with the hide/show transform time in the stylesheet.
  $provide.constant('notification/TRANSFORM_TIMEOUT_MS', 200);
}])

.factory('notification', ['require', require => {
  const getNotificationBus = require('notifications/bus');
  const setupClearMessageHooks = require('notifications/clearMessageHooks');
  const _ = require('lodash');

  const main = getNotificationBus('main');
  return _.extend(main, {
    setupClearMessageHooks: function () {
      setupClearMessageHooks(this);
    },
    getBus: getNotificationBus
  });
}])


.factory('notifications/bus', ['require', require => {
  const CLEAR_TIMEOUT_MS = require('notification/CLEAR_TIMEOUT_MS');
  const TRANSFORM_TIMEOUT_MS = require('notification/TRANSFORM_TIMEOUT_MS');
  const _ = require('lodash');

  const buses = {};
  const $timeout = require('$timeout');

  return function getNotificationBus (name) {
    if (!(name in buses)) {
      buses[name] = createNotificationBus();
    }
    return buses[name];
  };

  function createNotificationBus () {
    return {
      messages: [],

      error: function (body) {
        this._notify(body, 'error');
      },

      warn: function (body) {
        this.error(body);
      },

      info: function (body) {
        this._notify(body, 'info');
      },

      markAsSeen: function () {
        const self = this;
        if (this.message) {
          this.message.hidden = true;
        }
        window.clearTimeout(this._seenTimeout);
        $timeout(() => {
          window.setTimeout(
            () => {
              // The message needs to be cleared asynchronously to ensure the
              // UI transform and message clear events are not executed in
              // immediate sequence.
              self.clear();
            },
            TRANSFORM_TIMEOUT_MS
          );
        });
      },

      clear: function () {
        this.message = null;
      },

      clearSeen: function () {
        const timestamp = this.message && this.message.timestamp;
        const elapsed = _.now() - timestamp;
        if (timestamp && elapsed > 1 * 1000) {
          this.markAsSeen();
        }
      },

      _notify: function (body, severity) {
        const self = this;

        this.message = {
          body: body,
          hidden: true,
          severity: severity,
          timestamp: _.now()
        };

        this._seenTimeout = window.setTimeout(
          () => {
            self.markAsSeen();
          },
          CLEAR_TIMEOUT_MS
        );

        $timeout(() => {
          // The message needs to be unhidden asynchronously to ensure the
          // UI transform occurs on the initial appearance of the element.
          if (self.message) {
            self.message.hidden = false;
          }
        });
      }

    };
  }
}])

.factory('notifications/clearMessageHooks', ['require', require => {
  const $rootScope = require('$rootScope');
  const Command = require('command');

  return function init (notification) {
    $rootScope.$on('$stateChangeSuccess', () => {
      notification.clearSeen();
    });

    Command.executions.attach(() => {
      notification.clearSeen();
    });
  };
}]);
