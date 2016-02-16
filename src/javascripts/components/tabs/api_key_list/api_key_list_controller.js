'use strict';

angular.module('contentful')
.controller('ApiKeyListController', ['$scope', '$injector',
function ApiKeyListController ($scope, $injector) {
  var ReloadNotification = $injector.get('ReloadNotification');
  var spaceContext       = $injector.get('spaceContext');
  var accessChecker      = $injector.get('accessChecker');

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

  $scope.refreshApiKeys = function() {
    return spaceContext.space.getDeliveryApiKeys({limit: 1000})
    .then(function (apiKeys) {
      $scope.apiKeys = apiKeys;
      $scope.context.ready = true;
    }, accessChecker.wasForbidden($scope.context))
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
}]);
