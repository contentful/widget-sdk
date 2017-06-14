'use strict';

angular.module('contentful').directive('cfMainNavBar', ['require', function (require) {

  var accessChecker = require('accessChecker');

  return {
    template: require('components/client/MainNavBar').default(),
    restrict: 'E',
    replace: true,
    controller: ['$scope', function ($scope) {

      $scope.$state = require('$state');
      $scope.$stateParams = require('$stateParams');

      $scope.$watch(function () {
        return accessChecker.getSectionVisibility();
      }, function (sectionVisibility) {
        $scope.canNavigateTo = sectionVisibility;
      });
    }]
  };
}]);
