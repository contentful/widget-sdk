'use strict';

angular.module('contentful').factory('ReloadNotification', function  ReloadNotificationFactory($injector, modalDialog) {
  var open = false;

  function reloadWithCacheBuster() {
    var $location = $injector.get('$location');
    var search = $location.search();
    search.cfv = Math.ceil(Math.random()*10000000);
    $location.search(search);
    window.location = '/';
  }

  return {
    triggerImmediateReload: function () {
      reloadWithCacheBuster();
    },

    trigger: function(message) {
      if(open) return;
      open = true;
      if (!message) {
        message = 'The application has encountered a problem and needs to reload.';
      }
      modalDialog.open({
        title: 'The application needs to reload',
        message: message,
        scope: $injector.get('$rootScope'),
        cancelLabel: null,
        noBackgroundClose: true
      }).then(reloadWithCacheBuster);
    }
  };
});
