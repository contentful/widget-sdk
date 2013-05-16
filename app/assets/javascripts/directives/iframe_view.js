angular.module('contentful').directive('iframeView', function($window, $rootScope){
  'use strict';

  // Create IE + others compatible event handler
  var eventMethod = $window.addEventListener ? 'addEventListener' : 'attachEvent';
  var eventer = $window[eventMethod];
  var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

  // Listen to message from child window
  eventer(messageEvent, function(event) {
    if (!event.origin.match(/(flinkly.com|joistio.com|contentful.com)(:\d+)?$/)) // important security check
      return;

    $rootScope.$apply(function (scope) {
      scope.$broadcast('iframeMessage', event.data);
    });

  },false);


  return {
    template: JST['iframe_view'](),
    restrict: 'C'
  };
});

