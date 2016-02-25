'use strict';

angular.module('contentful').directive('cfSpaceSettings', ['$injector', function ($injector) {

  var authentication = $injector.get('authentication');
  var spaceContext   = $injector.get('spaceContext');

  return {
    template: JST['iframe_view'](),
    restrict: 'E',
    link: function (scope, el) {
      // @todo legacy thing, has to be true all the time:
      scope.hasLoaded = true;

      scope.iframeId  = 'spaceSettingsFrame';
      scope.iframeSrc = buildSrc();

      scope.$on('iframeMessage', markContextAsReady);

      function buildSrc() {
        return [
          authentication.spaceSettingsUrl(spaceContext.getId()),
          '/edit?access_token=', authentication.token
        ].join('');
      }

      function markContextAsReady(event, data, iframe) {
        if (iframe === el.find('iframe').get(0)) {
          scope.context.ready = true;
        }
      }
    }
  };
}]);
