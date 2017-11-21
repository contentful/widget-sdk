'use strict';

angular.module('contentful')

.factory('notification', ['require', function (require) {
  var getNotificationBus = require('notifications/bus');
  var setupClearMessageHooks = require('notifications/clearMessageHooks');

  var main = getNotificationBus('main');
  return _.extend(main, {
    setupClearMessageHooks: function () {
      setupClearMessageHooks(this);
    },
    getBus: getNotificationBus
  });
}])


.factory('notifications/bus', [function () {
  var buses = {};

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

      clear: function () {
        this.message = null;
      },

      clearSeen: function () {
        var timestamp = this.message && this.message.timestamp;
        var elapsed = _.now() - timestamp;
        if (timestamp && elapsed > 1 * 1000) {
          this.clear();
        }
      },

      _notify: function (body, severity) {
        var message = {
          body: body,
          severity: severity,
          seen: false,
          timestamp: _.now()
        };

        this.message = message;
      },

    };
  }
}])

.factory('notifications/clearMessageHooks', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var Command = require('command');

  return function init (notification) {
    $rootScope.$on('$stateChangeSuccess', function () {
      notification.clearSeen();
    });

    Command.executions.attach(function () {
      notification.clearSeen();
    });
  };
}]);
