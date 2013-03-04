angular.module('contentful/directives').directive('iframeView', function(){
  'use strict';

  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    scope: {
      tab: '=',
      bucketContext: '='
    },
    //controller: 'IframeViewCtrl',
    link: function (scope) {
      // Create IE + others compatible event handler
      var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
      var eventer = window[eventMethod];
      var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

      // Listen to message from child window
      eventer(messageEvent, function(event) {
        //if (event.origin !== window.location.origin) // important security check
          //return;

        scope.$apply(function (scope) {
          scope.$emit('iframeMessage', event.data);
        });

      },false);

      //$(window).on('message', function (event) {
      //  if (event.origin !== window.location.origin) return;
      //});
    }
  };
});

