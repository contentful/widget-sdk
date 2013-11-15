'use strict';
angular.module('contentful').directive('cfProfileView', function($window, $rootScope, authentication, routing, sentry){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    scope: true,
    link: function (scope, elem) {
      scope.tab = {params: {fullscreen: true}};
      elem.hide();

      scope.$on('$routeChangeSuccess', function (event, route, previous) {
        update(route, previous);
      });

      scope.$on('iframeMessage', function (event, data, iframe) {
        if (iframe !== elem.find('iframe')[0]) return;
        if (data.path) pathChanged(data.path);
      });

      function update(route, previous) {
        if (route.viewType === 'profile') {
          if (!previous || previous.viewType !== 'profile') {
            var pathSuffix = routing.getRoute().params.pathSuffix || 'user';
            scope.url = scope.url || authentication.profileUrl() + '/' + pathSuffix + '?access_token='+authentication.token;
          }
          elem.show();
        } else {
          elem.hide();
        }
      }

      function pathChanged(path) {
        var pathSuffix = path.match(/profile\/(.*$)/)[1];
        scope.goToProfile(pathSuffix);
      }
    }
  };
});
