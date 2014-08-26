'use strict';

angular.module('contentful').provider('$exceptionHandler', function () {
  this.$get = ['$injector', '$log', 'logger', 'environment',
    function($injector, $log, logger, environment) {
      return function(exception) {
        $log.error.apply($log, arguments);
        logger.captureException(exception, {promptedReload: true});
        if (environment.env != 'development') {
          var ReloadNotification = $injector.get('ReloadNotification');
          ReloadNotification.trigger();
        }
      };
    }
  ];
});
