'use strict';

angular.module('contentful').
  directive('cfUser', function() {
    return {
      restrict: 'C',
      controller: function($scope, $attrs, userCache) {
        $scope.$watch($attrs.link, function(link) {
          if (!link || !$attrs.as) return;
          userCache.get($scope.spaceContext.space, link.sys.id, function(err, user) {
            if (err) return;
            $scope.$apply(function() {
              $scope[$attrs.as] = user;
              $scope.currentUserName = (user.getId() === $scope.user.sys.id) ? 'You' : user.getName();
            });
          });
        }, true);
      }
    };
  });
