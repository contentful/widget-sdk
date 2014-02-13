'use strict';
angular.module('contentful').directive('spaceSettings', function($window, $rootScope, authentication, routing){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    scope: true,
    link: function (scope, elem) {
      scope.$on('$routeChangeSuccess', function (event, route, previous) {
        routeChanged(route, previous);
      });

      scope.$on('iframeMessage', function (event, data, iframe) {
        if (iframe !== elem.find('iframe')[0]) return;
        scope.hasLoaded = true;
        if (data.path && data.action === 'update') internalNavigationTo(data.path);
      });

      scope.hasLoaded = false;

      init();

      function init() {
        var pathSuffix = scope.tab.params.pathSuffix;
        var url = buildUrl(pathSuffix);
        if (!urlIsActive(url)) {
          scope.url = url;
          elem.find('iframe').prop('src', appendToken(scope.url));
        }
      }

      function routeChanged(route) {
        if (route.viewType !== 'space-settings') return;
        updateFrameLocation();
      }

      function updateFrameLocation() {
        var pathSuffix = routing.getRoute().params.pathSuffix || 'edit';
        var url = buildUrl(pathSuffix);
        if (!urlIsActive(url)) {
          scope.url = url;
          elem.find('iframe').prop('src', appendToken(scope.url));
        }
      }

      function internalNavigationTo(path) {
        var oldPathSuffix = extractPathSuffix(scope.url);
        var pathSuffix    = extractPathSuffix(path);
        scope.url = buildUrl(pathSuffix);
        if (oldPathSuffix !== pathSuffix) scope.navigator.spaceSettings(pathSuffix).goTo();
      }

      function urlIsActive(url) {
        //var activeURL = elem.find('iframe').prop('src');
        return url.indexOf(scope.url) >= 0;
      }

      function buildUrl(pathSuffix) {
        var spaceId = scope.spaceContext.space.getId();
        return authentication.spaceSettingsUrl(spaceId) + '/' + pathSuffix;
      }

      function extractPathSuffix(path) {
        var match = path.match(/settings\/spaces\/\w+\/(.*$)/);
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

