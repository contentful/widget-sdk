'use strict';

angular.module('contentful').controller('SpaceController', ['$scope', '$injector', function SpaceController($scope, $injector) {
  var $controller    = $injector.get('$controller');
  var $rootScope     = $injector.get('$rootScope');
  var analytics      = $injector.get('analytics');
  var authentication = $injector.get('authentication');
  var authorization  = $injector.get('authorization');
  var enforcements   = $injector.get('enforcements');

  $controller('UiConfigController', {$scope: $scope});
  $scope.entityCreationController = $controller('EntityCreationController', {$scope: $scope});

  $scope.$watch(function () {
    return authorization.isUpdated(authentication.tokenLookup, $scope.spaceContext.space) && authentication.tokenLookup;
  }, function (updated) {
    if(updated) {
      var enforcement = enforcements.getPeriodUsage();
      if(enforcement) {
        $rootScope.$broadcast('persistentNotification', {
          message: enforcement.message,
          actionMessage: enforcement.actionMessage,
          action: enforcement.action
        });
      }
    }
  });

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

}]);
