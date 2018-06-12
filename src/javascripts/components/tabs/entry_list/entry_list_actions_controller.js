'use strict';

angular.module('contentful')

.controller('EntryListActionsController', ['$scope', 'require', function EntryListActionsController ($scope, require) {
  var accessChecker = require('access_control/AccessChecker');
  var $controller = require('$controller');
  var spaceContext = require('spaceContext');
  var Analytics = require('analytics/Analytics');

  var listActionsController = $controller('ListActionsController', {
    $scope: $scope,
    entityType: 'Entry'
  });

  $scope.showDuplicate = showDuplicate;
  $scope.duplicateSelected = duplicate;

  var controller = this;
  var publish = $scope.publishSelected;
  $scope.publishSelected = function () {
    const contentTypes = getContentTypes();
    publish.apply(controller, arguments)
    .then(results => {
      results.succeeded.forEach(
        entryEventTracker('publish', 'content-list', contentTypes)
      );
    });
  };

  function showDuplicate () {
    return !accessChecker.shouldHide('createEntry') && !accessChecker.shouldDisable('createEntry');
  }

  function duplicate () {
    const contentTypes = getContentTypes();
    listActionsController.duplicate().then(results => {
      var succeeded = results.succeeded;
      succeeded.forEach(
        entryEventTracker('create', 'content-list__duplicate', contentTypes)
      );
      $scope.entries.unshift.apply($scope.entries, succeeded);
      $scope.paginator.setTotal(total => total + succeeded.length);
      // instead of the stuff done above, we should call updateEntries here
      // and treat the server as the source of truth.
      // Just appending entries here for e.g., will not respect what the user
      // has sorted entries on the page by.
      // Calling updateEntries would alleviate this problem.
    });
  }

  // Returns an object having signature { [entryId]: [contentType] }.
  function getContentTypes () {
    return $scope.selection.getSelected().reduce(
      (contentTypes, entry) => {
        const contentTypeId = entry.data.sys.contentType.sys.id;
        contentTypes[contentTypeId] = spaceContext.publishedCTs.get(
          contentTypeId
        );
        return contentTypes;
      },
      {}
    );
  }

  function entryEventTracker (action, origin, contentTypes) {
    return entry => {
      var event = 'entry:' + action; // entry:create, entry:publish
      Analytics.track(event, {
        eventOrigin: origin,
        contentType: contentTypes[entry.data.sys.contentType.sys.id],
        response: entry
      });
    };
  }
}]);
