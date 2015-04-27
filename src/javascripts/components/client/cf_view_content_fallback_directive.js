'use strict';

angular.module('contentful').directive('cfViewContentFallback', [function () {
  return {
    template: JST.cf_view_content_fallback(),
    restrict: 'E',
    replace: true,
    link: function (scope) {
      scope.$watch('spaceContext && spaceContext.space && spaceContext.space.isHibernated()', function (val) {
        scope.isSpaceHibernated = val;
      });
      scope.$watch('!spaces || spaces && spaces.length === 0', function (val) {
        scope.noSpacesAvailable = val;
      });
    }
  };
}]);
