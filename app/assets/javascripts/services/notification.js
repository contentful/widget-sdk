'use strict';

angular.module('contentful/services').
  service('notification', function() {
    return {
      messages: [],

      error: function(body) {
        this._notify(body, 'error');
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
