'use strict';
angular.module('contentful').directive('iframeView', function($window, $rootScope, authentication, routing){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    link: function (scope, elem) {
      var pathSuffix, pathChanged;

      if (scope.tab.params.mode === 'spaceSettings') { //Special mode for spaceSettings
        pathSuffix = scope.tab.params.pathSuffix || 'edit';
        scope.iframeSrc = authentication.spaceSettingsUrl(scope.spaceContext.space.getId()) + '/' + pathSuffix + '?access_token='+authentication.token;
        pathChanged = function (path) {
          var match = path.match(/settings\/spaces\/\w+\/(.*$)/);
          if (match) {
            scope.tab.params.pathSuffix = match[1];
            if (scope.tab.active()) routing.goToTab(scope.tab);
          }
        };
      } else {
        scope.iframeSrc = scope.tab.params.url;
      }

      scope.$on('iframeMessage', function (event, data, iframe) {
        if (iframe !== elem.find('iframe')[0]) return;
        scope.hasLoaded = true;
        if (pathChanged && data.path) pathChanged(data.path);
      });

      scope.hasLoaded = false;
    }
  };
});

