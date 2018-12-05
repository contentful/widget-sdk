'use strict';

angular.module('contentful').factory('ReloadNotification', [
  'require',
  require => {
    var _ = require('lodash');
    var $location = require('$location');
    var $q = require('$q');
    var modalDialog = require('modalDialog');

    var open = false;

    function reloadWithCacheBuster() {
      var search = $location.search();
      var reloaded = search.reloaded;
      search.cfv = Math.ceil(Math.random() * 10000000);
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
      if (open) return;
      open = true;
      options = _.defaults({}, options, {
        title: 'The application needs to reload',
        message: 'The application has encountered a problem and needs to reload.',
        cancelLabel: null,
        confirmLabel: 'Reload application',
        backgroundClose: false,
        ignoreEsc: true,
        disableTopCloseButton: true
      });
      modalDialog.open(options).promise.then(reloadWithCacheBuster);
    }

    function isApiError(error) {
      return (
        _.isObject(error) &&
        'statusCode' in error &&
        error.statusCode >= 500 &&
        error.statusCode !== 502
      ); // 502 means a space is hibernated
    }

    return {
      triggerImmediateReload: function() {
        reloadWithCacheBuster();
      },

      trigger: function(message, title) {
        trigger({ message: message, title: title });
      },

      gatekeeperErrorHandler: function(err) {
        if (isApiError(err)) {
          trigger({
            title: 'Error connecting to authentication server',
            template: 'api_error_dialog',
            message: 'There was an error trying to retrieve login information.',
            attachTo: 'body'
          });
        }
        return $q.reject(...arguments);
      },
      apiErrorHandler: function(err) {
        if (isApiError(err)) {
          trigger({
            title: 'Error connecting to backend',
            template: 'api_error_dialog',
            message: 'There was a problem connecting to the Content Management API.'
          });
        }
        return $q.reject(...arguments);
      },
      basicErrorHandler: function() {
        trigger();
      }
    };
  }
]);
