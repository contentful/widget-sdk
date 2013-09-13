angular.module('contentful').directive('iframeView', function($window, $rootScope, authentication, routing){
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
      scope.$broadcast('iframeMessage', event);
    });

  },false);


  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    link: function (scope, elem) {
      //$('iframe', elem).attr('src', scope.tab.params.baseUrl + scope.tab.params.urlSuffix);

      var pathSuffix, pathChanged;
      if (scope.tab.params.mode === 'spaceSettings') { //Special mode for spaceSettings
        pathSuffix = scope.tab.params.pathSuffix || 'edit';
        scope.url = authentication.spaceSettingsUrl(scope.spaceContext.space.getId()) + '/' + pathSuffix + '?access_token='+authentication.token;
        pathChanged = function (path) {
          scope.tab.params.pathSuffix = path.match(/settings\/spaces\/\w+\/(.*$)/)[1];
          if (scope.tab.active()) routing.setTab(scope.tab);
        };
      } else if (scope.tab.params.mode === 'profile') {
        pathSuffix = scope.tab.params.pathSuffix || 'edit';
        scope.url = authentication.profileUrl() + '/' + pathSuffix + '?access_token='+authentication.token;
      } else {
        scope.url = scope.tab.params.url;
      }

      scope.$on('iframeMessage', function (event, messageEvent) {
        if (messageEvent.source !== $('iframe', elem)[0].contentWindow) return;
        if (pathChanged) pathChanged(messageEvent.data.path);
      });
    }
  };
});

