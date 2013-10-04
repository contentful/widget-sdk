'use strict';

angular.module('contentful').run(function($window, $rootScope, $sce){
  // Create IE + others compatible event handler
  var eventMethod = $window.addEventListener ? 'addEventListener' : 'attachEvent';
  var eventer = $window[eventMethod];
  var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

  // Listen to message from child window
  eventer(messageEvent, function(event) {
    $sce.getTrustedResourceUrl(event.origin); // important security check

    $rootScope.$apply(function (scope) {
      scope.$broadcast('iframeMessage', event);
    });

  },false);
});
