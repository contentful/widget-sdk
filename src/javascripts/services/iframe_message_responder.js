'use strict';

angular.module('contentful').run(['$injector', function ($injector) {

  var $window    = $injector.get('$window');
  var $rootScope = $injector.get('$rootScope');
  var $sce       = $injector.get('$sce');
  var userAgent  = $injector.get('userAgent');

  // Listen to message from child window
  $window.addEventListener('message', function (event) {
    try {
      $sce.getTrustedResourceUrl(event.origin); // important security check
    } catch (e) {
      return;
    }

    if (userAgent.isIE()) {
      event = {
        data: JSON.parse(event.data),
        source: event.source
      };
    }

    var iframe = $('iframe[data-iframe-message-channel]')
                 .filter(function () { return this.contentWindow === event.source; })
                 .get(0);

    if (!iframe) {
      return;
    }

    $rootScope.$apply(function (scope) {
      scope.$broadcast('iframeMessage', event.data, iframe);
    });

  }, false);
}]);
