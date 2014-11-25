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

  $scope.$watch(function (scope) {
    if (scope.spaceContext && scope.spaceContext.space) {
      return _.map(scope.spaceContext.space.getPrivateLocales(), function (locale) {
        return locale.code;
      });
    }
  }, function (codes, old, scope) {
    if (codes) scope.spaceContext.refreshLocales();
  }, true);

  $scope.$watch('spaceContext.localeStates', function () {
    $scope.spaceContext.refreshActiveLocales();
  }, true);

  $scope.$watch('spaceContext', function(space, o, scope) {
    enforcements.setSpaceContext(scope.spaceContext);
    scope.spaceContext.refreshContentTypes();
  });

  $scope.$watch(function () {
    return authorization.isUpdated(authentication.tokenLookup, $scope.spaceContext.space) && authentication.tokenLookup;
  }, function (updated) {
    if(updated) {
      var enforcement = enforcements.getPeriodUsage();
      if(enforcement) {
        $rootScope.$broadcast('persistentNotification', {
          message: enforcement.message,
          tooltipMessage: enforcement.description,
          actionMessage: enforcement.actionMessage,
          action: enforcement.action
        });
      }
    }
  });

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

  $scope.broadcastFromSpace = function(){
    $scope.$broadcast.apply($scope, arguments);
  };

  $scope.$on('spaceCreated', function () {
    $scope.entityCreationController.firstContentType();
  });


}]);
