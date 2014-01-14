'use strict';

angular.module('contentful').
  controller('ApiKeyListCtrl', function($scope, $window, environment) {
    $scope.marketingUrl = environment.settings.marketing_url;

    $scope.refreshApiKeys = function() {
      $scope.spaceContext.space.getApiKeys({limit: 1000}, function(err, apiKeys) {
        $scope.$apply(function() {
          $scope.apiKeys = apiKeys;
        });
      });
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

  });
