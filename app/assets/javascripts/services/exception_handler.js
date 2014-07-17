'use strict';

angular.module('contentful').provider('$exceptionHandler', function () {
  this.$get = ['$injector', '$log', 'sentry', 'environment',
    function($injector, $log, sentry, environment) {
      return function(exception) {
        $log.error.apply($log, arguments);
        sentry.captureException(exception, {extra: {'promptedReload': true}});
        if(window.Bugsnag)
          window.Bugsnag.notifyException(exception);
        if (environment.env != 'development') {
          var ReloadNotification = $injector.get('ReloadNotification');
          ReloadNotification.trigger();
        }
      };
    }
  ];
});
