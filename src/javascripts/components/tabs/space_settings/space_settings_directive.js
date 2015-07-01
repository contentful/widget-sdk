'use strict';
angular.module('contentful').directive('cfSpaceSettings', ['$window', '$rootScope', 'authentication', 'logger', function($window, $rootScope, authentication, logger){
  return {
    template: JST['iframe_view'](),
    restrict: 'A',
    scope: true,
    link: function (scope, elem) {
      scope.iframeId = 'spaceSettingsFrame';

      scope.$on('iframeMessage', function (event, data, iframe) {
        if (iframe !== elem.find('iframe')[0]) return;
        scope.hasLoaded = true;
        if (data.path && data.action === 'update') internalNavigationTo(data.path, data);
      });

      scope.hasLoaded = false;

      init();

      function init() {
        var pathSuffix = scope.$stateParams.pathSuffix;
        var url = buildUrl(pathSuffix);
        if (!urlIsActive(url)) {
          scope.url = url;
          elem.find('iframe').prop('src', appendToken(scope.url));
        }
      }

      function internalNavigationTo(path, data) {
        if(!scope.url || !path) logger.logError('scope url or path not defined in space settings', {
          data: {
            currentPath: path,
            scopeUrl: scope.url,
            data: data
          }
        });
        var oldPathSuffix = extractPathSuffix(scope.url);
        var pathSuffix    = extractPathSuffix(path);
        scope.url = buildUrl(pathSuffix);
        if (oldPathSuffix !== pathSuffix) scope.$state.go('spaces.detail.settings.pathSuffix', { pathSuffix: pathSuffix });
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
}]);

