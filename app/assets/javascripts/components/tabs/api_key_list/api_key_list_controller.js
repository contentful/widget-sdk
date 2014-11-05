'use strict';

angular.module('contentful').
  controller('ApiKeyListController', ['$scope', '$injector', function($scope, $injector) {
    var ReloadNotification = $injector.get('ReloadNotification');

    $scope.refreshApiKeys = function() {
      return $scope.spaceContext.space.getDeliveryApiKeys({limit: 1000})
      .then(function (apiKeys) {
        $scope.apiKeys = apiKeys;
      })
      .catch(ReloadNotification.apiErrorHandler);
    };

    $scope.$watch('apiKeys', function(apiKeys) {
      $scope.empty = _.isEmpty(apiKeys);
    });

    $scope.$on('entityDeleted', function (event, entity) {
      var scope = event.currentScope;
      var index = _.indexOf(scope.apiKeys, entity);
      if (index > -1) {
        scope.apiKeys.splice(index, 1);
      }
    });

    $scope.refreshApiKeys();

    $scope.$on('tabBecameActive', function(event, tab) {
      if (tab !== $scope.tab) return;
      $scope.refreshApiKeys();
    });

  }]);
