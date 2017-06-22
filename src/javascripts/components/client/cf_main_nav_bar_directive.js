'use strict';

angular.module('contentful').directive('cfMainNavBar', ['require', function (require) {

  var accessChecker = require('accessChecker');

  return {
    template: require('components/client/MainNavBar').default(),
    restrict: 'E',
    replace: true,
    controller: ['$scope', function ($scope) {
      var spaceContext = require('spaceContext');
      $scope.$state = require('$state');
      $scope.canNavigateTo = function (section) {
        if (!spaceContext.space || spaceContext.space.isHibernated()) {
          return false;
        } else {
          return accessChecker.getSectionVisibility()[section];
        }
      };
    }]
  };
}]);
