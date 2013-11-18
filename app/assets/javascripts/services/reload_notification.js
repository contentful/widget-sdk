'use strict';

angular.module('contentful').factory('ReloadNotification', function  ReloadNotificationFactory($injector, modalDialog) {
  function reloadWithCacheBuster() {
    var $location = $injector.get('$location');
    var search = $location.search();
    search.cfv = Math.ceil(Math.random()*10000000);
    $location.search(search);
    window.location = $location.url();
  }

  return {
    trigger: function(message) {
      if (!message) {
        message = 'The application has encountered a problem and needs to reload.';
      }
      modalDialog.open({
        title: 'The application needs to reload',
        message: message,
        scope: $injector.get('$rootScope'),
        cancelLabel: null
      }).then(reloadWithCacheBuster);
    }
  };
});
