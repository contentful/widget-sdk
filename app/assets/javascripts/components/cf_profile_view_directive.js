'use strict';
angular.module('contentful').directive('cfProfileView', function($window, $rootScope, authentication, routing){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    scope: true,
    link: function (scope, elem) {
      scope.tab = {params: {fullscreen: true}};

      scope.$on('$routeChangeSuccess', function (event, route) {
        update(route);
      });

      scope.$on('iframeMessage', function (event, messageEvent) {
        if (messageEvent.source !== $('iframe', elem)[0].contentWindow) return;
        if (pathChanged) pathChanged(messageEvent.data.path);
      });

      function update(route) {
        if (route.viewType === 'profile') {
          var pathSuffix = routing.getRoute().params.pathSuffix || 'user';
          scope.url = authentication.profileUrl() + '/' + pathSuffix + '?access_token='+authentication.token;
          elem.show();
        } else {
          scope.url = '';
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
