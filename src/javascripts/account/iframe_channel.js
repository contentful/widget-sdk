'use strict';

angular.module('contentful').factory('iframeChannel', ['$injector', function ($injector) {

  var $window      = $injector.get('$window');
  var $rootScope   = $injector.get('$rootScope');
  var $sce         = $injector.get('$sce');
  var userAgent    = $injector.get('userAgent');
  var createSignal = $injector.get('signal');

  return {
    create: function (iframe) {
      var message = createSignal();
      var dispatcher = createMessageDispatcher(iframe, message);

      $window.addEventListener('message', dispatcher, false);

      return {
        onMessage: message.attach,
        off: off
      };

      function off() {
        $window.removeEventListener('message', dispatcher, false);
      }
    }
  };

  function createMessageDispatcher(iframe, message) {
    return function processMessage (event) {
      try {
        // trust only our own domains:
        $sce.getTrustedResourceUrl(event.origin);
      } catch (e) {
        return;
      }

      if (userAgent.isIE()) {
        try {
          event = {
            data: JSON.parse(event.data),
            source: event.source
          };
        } catch (e) {
          return;
        }
      }

      if (iframe.get(0) === event.source) {
        $rootScope.$apply(function () {
          message.dispatch(event.data);
        });
      }
    };
  }
}]);
