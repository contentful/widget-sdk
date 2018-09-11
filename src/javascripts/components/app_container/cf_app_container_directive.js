'use strict';

angular.module('contentful').directive('cfAppContainer', [
  'require',
  require => ({
    template: require('components/app_container/AppContainer.es6').default(),
    restrict: 'E',
    controller: [
      '$scope',
      function($scope) {
        $scope.sidePanelIsShown = false;
        $scope.toggleSidePanel = () => {
          $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
          $scope.$applyAsync();
        };
      }
    ]
  })
]);
