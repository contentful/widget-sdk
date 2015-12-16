'use strict';

angular.module('contentful').directive('cfMainNavBar', function() {
  return {
    template: JST.cf_main_nav_bar(),
    restrict: 'E',
    replace: true,
    controller: ['$scope', '$injector', function ($scope, $injector) {

      $scope.$state       = $injector.get('$state');
      $scope.$stateParams = $injector.get('$stateParams');

      // FIXME I have no idea if permissions can change during the
      // lifetime of the app. If not, there is no need for this hack.
      $scope.$watch('permissionController.spaceContext', setupVisibilityHints);

      function setupVisibilityHints () {
        $scope.canNavigateTo = {
          contentType: can('updateContentType'),
          entry:       can('readEntry'),
          asset:       can('readAsset'),
          apiKey:      can('readApiKey'),
          settings:    can('updateSettings'),
        };
      }

      function can (action) {
        return !$scope.permissionController.get(action, 'shouldHide');
      }

    }]
  };
});
