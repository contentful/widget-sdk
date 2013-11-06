'use strict';

angular.module('contentful').factory('ReloadNotification', function  ReloadNotificationFactory(modalDialog, $rootScope) {
  return {
    trigger: function(message) {
      if (!message) {
        message = 'The application has encountered a problem and needs to reload.';
      }
      modalDialog.open({
        title: 'The application needs to reload',
        message: message,
        scope: $rootScope,
        cancelLabel: null
      }).then(function () {
        location.reload();
      });
    }
  };
});
