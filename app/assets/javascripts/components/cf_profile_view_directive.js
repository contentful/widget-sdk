'use strict';
angular.module('contentful').directive('cfProfileView', function($window, $rootScope, authentication, routing){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    scope: true,
    link: function (scope, elem) {
      scope.tab = {params: {fullscreen: true}};
      elem.hide();

      scope.$on('$routeChangeSuccess', function (event, route, previous) {
        routeChanged(route, previous);
      });

      scope.$on('iframeMessage', function (event, data, iframe) {
        if (iframe !== elem.find('iframe')[0]) return;
        if (data.path) internalNavigationTo(data.path);
      });

      function routeChanged(route) {
        if (route.viewType === 'profile') {
          updateFrameLocation();
          elem.show();
        } else {
          elem.hide();
        }
      }

      function updateFrameLocation() {
        var pathSuffix = routing.getRoute().params.pathSuffix || 'user';
        var url = buildUrl(pathSuffix);
        if (!urlIsActive(url)) {
          scope.url = url;
          console.log('iframe set src');
          elem.find('iframe').prop('src', appendToken(scope.url));
        }
      }

      function internalNavigationTo(path) {
        console.log('path changed', path, elem.find('iframe').prop('src'));
        var oldPathSuffix = extractPathSuffix(scope.url);
        var pathSuffix    = extractPathSuffix(path);
        scope.url = buildUrl(pathSuffix);
        if (oldPathSuffix !== pathSuffix) scope.goToProfile(pathSuffix);
      }

      function urlIsActive(url) {
        //var activeURL = elem.find('iframe').prop('src');
        return url.indexOf(scope.url) >= 0;
      }

      function buildUrl(pathSuffix) {
        return authentication.profileUrl() + '/' + pathSuffix;
      }

      function extractPathSuffix(path) {
        return path.match(/profile\/(.*$)/)[1];
      }

      function appendToken(url) {
        if (url.indexOf('?') >= 0) {
          return url + '&access_token='+authentication.token;
        } else {
          return url + '?access_token='+authentication.token;
        }
      }
    }
  };
});
