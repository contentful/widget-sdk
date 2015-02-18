'use strict';

angular.module('contentful').
  directive('cfUser', function() {
    return {
      restrict: 'A',
      controller: ['$scope', '$attrs', 'userCache', function($scope, $attrs, userCache) {
        $scope.$watch($attrs.link, function(link) {
          if (!link || !$attrs.as) return;
          userCache.get($scope.spaceContext.space, link.sys.id).then(function (user) {
            $scope[$attrs.as] = user;
          });
        }, true);
      }]
    };
  });
