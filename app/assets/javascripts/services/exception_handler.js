'use strict';

angular.module('contentful').provider('$exceptionHandler', function (environment) {
 this.$get = ['$log', function($log) {
    return function(exception) {
      $log.error.apply($log, arguments);
      if (environment.env === 'development') return;
      if (window.Raven) {
        window.Raven.captureException(exception, {
          tags: {
            type: 'error notification'
          }
        });
      }
    };
  }];
});
