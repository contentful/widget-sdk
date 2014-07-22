'use strict';

angular.module('contentful').
  controller('ApiKeyListCtrl', ['$scope', '$injector', function($scope, $injector) {
    var $q                 = $injector.get('$q');
    var ReloadNotification = $injector.get('ReloadNotification');

    $scope.refreshApiKeys = function() {
      var cb = $q.callback();
      $scope.spaceContext.space.getApiKeys({limit: 1000}, cb);
      return cb.promise.then(function (apiKeys) {
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
