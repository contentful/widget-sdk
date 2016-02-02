'use strict';

angular.module('contentful').directive('cfMainNavBar', ['$injector', function ($injector) {

  var accessChecker = $injector.get('accessChecker');

  return {
    template: JST.cf_main_nav_bar(),
    restrict: 'E',
    replace: true,
    controller: ['$scope', '$injector', function ($scope, $injector) {

      $scope.$state       = $injector.get('$state');
      $scope.$stateParams = $injector.get('$stateParams');

      $scope.$watch(function () {
        return accessChecker.getSectionVisibility();
      }, function (sectionVisibility) {
        $scope.canNavigateTo = sectionVisibility;
      });
    }]
  };
}]);
