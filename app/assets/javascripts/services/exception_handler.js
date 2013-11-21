'use strict';

angular.module('contentful').provider('$exceptionHandler', function () {
  this.$get = ['$injector', '$log', 'sentry',
    function($injector, $log, sentry) {
      return function(exception) {
        var ReloadNotification = $injector.get('ReloadNotification');
        $log.error.apply($log, arguments);
        sentry.captureException(exception);
        ReloadNotification.trigger();
      };
    }
  ];
});
