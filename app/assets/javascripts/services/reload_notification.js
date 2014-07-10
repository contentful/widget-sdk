'use strict';

angular.module('contentful').factory('ReloadNotification', ['$injector', function($injector) {
  var $location   = $injector.get('$location');
  var $rootScope  = $injector.get('$rootScope');
  var $q          = $injector.get('$q');
  var modalDialog = $injector.get('modalDialog');

  var open = false;

  function reloadWithCacheBuster() {
    var search = $location.search();
    search.cfv = Math.ceil(Math.random()*10000000);
    $location.search(search);
    window.location = $location.url();
  }

  function trigger(options) {
    if(open) return;
    open = true;
    options = _.defaults({}, options, {
      title: 'The application needs to reload',
      message: 'The application has encountered a problem and needs to reload.',
      scope: $rootScope,
      cancelLabel: null,
      noBackgroundClose: true
    });
    modalDialog.open(options)
    .then(reloadWithCacheBuster);
  }

  function isApiError(error) {
    return _.isObject(error) && 'statusCode' in error && 500 <= error.statusCode;
  }

  var ReloadNotificationService = {
    triggerImmediateReload: function () {
      reloadWithCacheBuster();
    },

    trigger: function(message) {
      if(open) return;
      open = true;
      trigger({message: message});
    },

    apiErrorHandler: function (err) {
      if (isApiError(err)) {
        trigger({
          title: 'Error connecting to backend',
          template: 'api_error_dialog',
          message: null
        });
      }
      return $q.reject.apply($q, arguments);
    },
  };

  return ReloadNotificationService;
}]);
