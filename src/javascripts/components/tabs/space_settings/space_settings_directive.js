'use strict';
angular.module('contentful').directive('cfSpaceSettings', ['$injector', function ($injector) {

  var authentication = $injector.get('authentication');
  var logger         = $injector.get('logger');
  var spaceContext   = $injector.get('spaceContext');
  var $state         = $injector.get('$state');
  var $stateParams   = $injector.get('$stateParams');

  return {
    template: JST['iframe_view'](),
    restrict: 'E',
    scope: true,
    link: function (scope, elem) {
      scope.iframeId = 'spaceSettingsFrame';

      scope.$on('iframeMessage', function (event, data, iframe) {
        if (iframe !== elem.find('iframe')[0]) return;
        scope.hasLoaded = true;
        if (data.path && data.action === 'update') internalNavigationTo(data.path, data);
      });

      scope.$watch(function () {
        return $stateParams.pathSuffix;
      }, function (pathSuffix) {
        if (pathSuffix && (pathSuffix !== extractPathSuffix(scope.url))) {
          loadGatekeeperView();
        }
      });

      scope.hasLoaded = false;

      loadGatekeeperView();

      function loadGatekeeperView() {
        var pathSuffix = $stateParams.pathSuffix;
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
        if (oldPathSuffix !== pathSuffix) {
          $state.go('spaces.detail.settings.iframe.pathSuffix', { pathSuffix: pathSuffix });
        }
      }

      function urlIsActive(url) {
        return url.indexOf(scope.url) >= 0;
      }

      function buildUrl(pathSuffix) {
        return authentication.spaceSettingsUrl(spaceContext.getId()) + '/' + pathSuffix;
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

