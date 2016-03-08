'use strict';

angular.module('contentful').factory('iframeChannel', ['$injector', function ($injector) {

  var $window      = $injector.get('$window');
  var $rootScope   = $injector.get('$rootScope');
  var $sce         = $injector.get('$sce');
  var userAgent    = $injector.get('userAgent');
  var createSignal = $injector.get('signal');

  var message = createSignal();

  return {
    init: function () {
      $window.addEventListener('message', processMessage, false);
    },
    message: message
  };

  function processMessage(event) {
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

    var iframes = $('iframe[data-iframe-message-channel]');
    var iframe = iframes.filter(isSource(event)).get(0);

    if (!iframe) {
      return;
    }

    $rootScope.$apply(function () {
      message.dispatch(event.data, iframe);
    });
  }

  function isSource(event) {
    return function () {
      return this.contentWindow === event.source;
    };
  }
}]);
