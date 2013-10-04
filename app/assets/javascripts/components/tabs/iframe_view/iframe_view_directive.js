'use strict';
angular.module('contentful').directive('iframeView', function($window, $rootScope, authentication, routing){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    link: function (scope, elem) {
      var pathSuffix, pathChanged;

      if (scope.tab.params.mode === 'spaceSettings') { //Special mode for spaceSettings
        pathSuffix = scope.tab.params.pathSuffix || 'edit';
        scope.url = authentication.spaceSettingsUrl(scope.spaceContext.space.getId()) + '/' + pathSuffix + '?access_token='+authentication.token;
        pathChanged = function (path) {
          scope.tab.params.pathSuffix = path.match(/settings\/spaces\/\w+\/(.*$)/)[1];
          if (scope.tab.active()) routing.gotoTab(scope.tab);
        };
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

