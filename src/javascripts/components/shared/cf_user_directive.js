'use strict';

angular.module('contentful')
.directive('cfUser', function() {
  return {
    restrict: 'A',
    controller: ['$scope', '$attrs', '$injector', function($scope, $attrs, $injector) {
      var spaceContext = $injector.get('spaceContext');
      $scope.$watch($attrs.link, function(link) {
        if (!link || !$attrs.as) return;
        spaceContext.users.get(link.sys.id).then(function (user) {
          if (user) {
            $scope[$attrs.as] = user;
          }
        });
      }, true);
    }]
  };
});
