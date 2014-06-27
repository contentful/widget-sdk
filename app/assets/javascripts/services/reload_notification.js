'use strict';

angular.module('contentful').factory('ReloadNotification', ['$window', '$location', '$rootScope', 'modalDialog', function($window, $location, $rootScope, modalDialog) {
  var open = false;

  function reloadWithCacheBuster() {
    var search = $location.search();
    search.cfv = Math.ceil(Math.random()*10000000);
    $location.search(search);
    window.location = $location.url();
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
        scope: $rootScope,
        cancelLabel: null,
        noBackgroundClose: true
      }).then(reloadWithCacheBuster);
    }
  };
}]);
