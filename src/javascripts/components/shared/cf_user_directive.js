'use strict';

angular.module('contentful')
.directive('cfUser', () => ({
  restrict: 'A',

  controller: ['$scope', '$attrs', 'require', ($scope, $attrs, require) => {
    const spaceContext = require('spaceContext');
    $scope.$watch($attrs.link, link => {
      if (!link || !$attrs.as) return;
      spaceContext.users.get(link.sys.id).then(user => {
        if (user) {
          $scope[$attrs.as] = user;
        }
      });
    }, true);
  }]
}));
