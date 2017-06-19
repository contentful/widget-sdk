angular.module('contentful')
.directive('cfProfileNav', ['require', function (require) {
  return {
    template: require('account/ProfileNav').default(),
    restrict: 'E',
    controller: ['$scope', function ($scope) {
      $scope.$state = require('$state');
    }]
  };
}]);
