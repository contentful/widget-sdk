'use strict';

angular.module('contentful').provider('$exceptionHandler', function () {
 this.$get = ['$log', function($log) {
    return function(exception) {
      $log.error.apply($log, arguments);
      if (window.Raven) {
        window.Raven.captureException(exception, {
          logger: 'user_interface',
          tags: {
            type: 'exception'
          }
        });
      }
    };
  }];
});
