'use strict';

angular.module('contentful').run(['$window', '$rootScope', '$sce', function($window, $rootScope, $sce){
  // Listen to message from child window
  $window.addEventListener('message', function(event) {
    try{
      $sce.getTrustedResourceUrl(event.origin); // important security check
    } catch (e) {
      return;
    }

    if ($window.navigator && $window.navigator.userAgent && $window.navigator.userAgent.match(/MSIE/)) {
      event = {
        data: JSON.parse(event.data),
        source: event.source,
      };
    }

    var iframe = $('iframe[data-iframe-message-channel]')
                 .filter(function () { return this.contentWindow === event.source; })
                 .get(0);

    $rootScope.$apply(function (scope) {
      scope.$broadcast('iframeMessage', event.data, iframe);
    });

  },false);
}]);
