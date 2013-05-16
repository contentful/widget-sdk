'use strict';

angular.module('contentful').
  directive('cfUser', function() {
    return {
      restrict: 'C',
      controller: function($scope, $attrs, userCache) {
        $scope.$watch($attrs.link, function(link) {
          if (!link || !$attrs.as) return;
          userCache.get($scope.bucketContext.bucket, link.sys.id, function(err, user) {
            if (err) return;
            $scope.$apply(function() {
              $scope[$attrs.as] = user;
            });
          });
        }, true);
      }
    };
  });
