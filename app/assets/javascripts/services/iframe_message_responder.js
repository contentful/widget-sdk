'use strict';

angular.module('contentful').run(['$window', '$rootScope', '$sce', function($window, $rootScope, $sce){
  // Create IE + others compatible event handler
  var eventMethod = $window.addEventListener ? 'addEventListener' : 'attachEvent';
  var eventer = $window[eventMethod];
  var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

  // Listen to message from child window
  eventer(messageEvent, function(event) {
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

    var iframe = $('iframe').filter(function () { return this.contentWindow === event.source; })[0];

    $rootScope.$apply(function (scope) {
      scope.$broadcast('iframeMessage', event.data, iframe);
    });

  },false);
}]);
