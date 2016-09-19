'use strict';

angular.module('contentful')

.controller('EntryListActionsController', ['$scope', 'require', function EntryListActionsController ($scope, require) {

  var accessChecker = require('accessChecker');
  var $controller = require('$controller');

  var listActionsController = $controller('ListActionsController', {
    $scope: $scope,
    entityType: 'Entry'
  });

  $scope.showDuplicate = showDuplicate;
  $scope.duplicateSelected = duplicate;

  function showDuplicate () {
    return !accessChecker.shouldHide('createEntry') && !accessChecker.shouldDisable('createEntry');
  }

  function duplicate () {
    listActionsController.duplicate().then(function (results) {
      var succeeded = results.succeeded;
      $scope.entries.unshift.apply($scope.entries, succeeded);
      $scope.paginator.setTotal(function (total) {
        return total + succeeded.length;
      });
    });
  }
}]);
