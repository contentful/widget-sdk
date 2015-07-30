'use strict';

angular.module('contentful').controller('SpaceController', ['$scope', '$injector', function SpaceController($scope, $injector) {
  var $controller    = $injector.get('$controller');
  var $rootScope     = $injector.get('$rootScope');
  var analytics      = $injector.get('analytics');
  var authentication = $injector.get('authentication');
  var authorization  = $injector.get('authorization');
  var enforcements   = $injector.get('enforcements');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  $controller('UiConfigController', {$scope: $scope});
  $scope.entityCreationController = $controller('EntityCreationController', {$scope: $scope});

  $scope.$watch(function () {
    return _.map(TheLocaleStore.getPrivateLocales(), function (locale) {
      return locale.internal_code;
    });
  }, function (codes) {
    if (!_.isEmpty(codes)) TheLocaleStore.refreshLocales();
  }, true);

  // TODO useless
  $scope.$watch(function () {
    return TheLocaleStore.getLocaleStates();
  }, function () {
    TheLocaleStore.refreshActiveLocales();
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
          actionMessage: enforcement.actionMessage,
          action: enforcement.action
        });
      }
    }
  });

  $scope.$on('entityDeleted', function (event, contentType) {
    $scope.spaceContext.removeContentType(contentType);
  });

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

}]);
