'use strict';

angular.module('contentful')

.controller('EntryListActionsController', ['$scope', 'require', function EntryListActionsController ($scope, require) {
  var accessChecker = require('access_control/AccessChecker');
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
      // instead of the stuff done above, we should call updateEntries here
      // and treat the server as the source of truth.
      // Just appending entries here for e.g., will not respect what the user
      // has sorted entries on the page by.
      // Calling updateEntries would alleviate this problem.
    });
  }
}]);
