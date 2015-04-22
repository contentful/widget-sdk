'use strict';

angular.module('contentful').factory('ReloadNotification', ['$injector', function($injector) {
  var $location   = $injector.get('$location');
  var $rootScope  = $injector.get('$rootScope');
  var $q          = $injector.get('$q');
  var modalDialog = $injector.get('modalDialog');
  var analytics   = $injector.get('analytics');

  var open = false;

  function reloadWithCacheBuster() {
    var search = $location.search();
    var reloaded = search.reloaded;
    search.cfv = Math.ceil(Math.random()*10000000);
    if (reloaded) {
      delete search.reloaded;
      $location.path('/');
    } else {
      search.reloaded = true;
    }
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
      confirmLabel: 'Reload application',
      noBackgroundClose: true
    });
    modalDialog.open(options).promise.then(reloadWithCacheBuster);
  }

  function isApiError(error) {
    return _.isObject(error) &&
      'statusCode' in error &&
      500 <=  error.statusCode &&
      502 !== error.statusCode; // 502 means a space is hibernated
  }

  var ReloadNotificationService = {
    triggerImmediateReload: function () {
      analytics.trackPersistentNotificationAction('App Reload');
      reloadWithCacheBuster();
    },

    trigger: function(message) {
      trigger({message: message});
    },

    gatekeeperErrorHandler: function (err) {
      if (isApiError(err)) {
        trigger({
          title: 'Error connecting to authentication server',
          template: 'api_error_dialog',
          message: 'There was an error trying to retrieve login information.',
          attachTo: 'body'
        });
      }
      return $q.reject.apply($q, arguments);
    },
    apiErrorHandler: function (err) {
      if (isApiError(err)) {
        trigger({
          title: 'Error connecting to backend',
          template: 'api_error_dialog',
          message: 'There was a problem connecting to the Content Management API.'
        });
      }
      return $q.reject.apply($q, arguments);
    },
  };

  return ReloadNotificationService;
}]);
