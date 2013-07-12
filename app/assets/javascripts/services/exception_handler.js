'use strict';

angular.module('contentful').provider('$exceptionHandler', function () {
 this.$get = ['$log', 'sentry', function($log, sentry) {
    return function(exception) {
      $log.error.apply($log, arguments);
      sentry.captureException(exception);
    };
  }];
});
