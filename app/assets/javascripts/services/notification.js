'use strict';

angular.module('contentful').
  service('notification', function(sentry) {
    return {
      messages: [],

      error: function(body) {
        this._notify(body, 'error');
        sentry.captureError(body);
      },

      info: function(body) {
        this._notify(body, 'info');
      },

      _notify: function(body, severity) {
        var message = {
          body: body,
          severity: severity,
          seen: false
        };

        this.messages.push(message);
      },

      unseen: function() {
        return _.reject(this.messages, 'seen').reverse();
      }
    };
  });
