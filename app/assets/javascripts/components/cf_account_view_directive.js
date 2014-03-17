'use strict';
angular.module('contentful').directive('cfAccountView', function($window, $rootScope, authentication, routing, sentry){
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
        scope.hasLoaded = true;
        if (data.path && data.action === 'update') internalNavigationTo(data.path, data);
      });

      scope.hasLoaded = false;

      function routeChanged(route) {
        if (route.viewType === 'account') {
          updateFrameLocation();
          elem.show();
        } else {
          elem.hide();
        }
      }

      function updateFrameLocation() {
        var pathSuffix = routing.getRoute().params.pathSuffix || 'profile/user';
        var url = buildUrl(pathSuffix);
        if (!urlIsActive(url)) {
          scope.url = url;
          elem.find('iframe').prop('src', appendToken(scope.url));
        }
      }

      function internalNavigationTo(path, data) {
        // FIXME data param only for debugging purposes
        //console.log('path changed', path, elem.find('iframe').prop('src'));
        if(!scope.url || !path) sentry.captureError('scope url or path not defined', {
          data: {
            currentPath: path,
            scopeUrl: scope.url,
            data: data
          }
        });
        var oldPathSuffix = extractPathSuffix(scope.url);
        var pathSuffix    = extractPathSuffix(path);
        scope.url = buildUrl(pathSuffix);
        if (oldPathSuffix !== pathSuffix) scope.goToAccount(pathSuffix);
      }

      function urlIsActive(url) {
        return url.indexOf(scope.url) >= 0;
      }

      function buildUrl(pathSuffix) {
        return authentication.accountUrl() + '/' + pathSuffix;
      }

      function extractPathSuffix(path) {
        var match = path.match(/account\/(.*$)/);
        return match && match[1];
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
