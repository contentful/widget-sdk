'use strict';

angular.module('contentful')
.controller('EntryListActionsController', ['$scope', '$injector', function EntryListActionsController ($scope, $injector) {

  var accessChecker = $injector.get('accessChecker');
  var $controller   = $injector.get('$controller');

  var listActionsController = $controller('ListActionsController', {
    $scope: $scope,
    entityType: 'entry'
  });

  $scope.showDuplicate     = showDuplicate;
  $scope.duplicateSelected = duplicate;

  function showDuplicate () {
    return !accessChecker.shouldHide('createEntry') && !accessChecker.shouldDisable('createEntry');
  }

  function duplicate () {
    listActionsController.batchPerformer.duplicate(function (succeeded) {
      $scope.entries.unshift.apply($scope.entries, succeeded);
      $scope.paginator.numEntries += succeeded.length;
    });
  }
}]);
