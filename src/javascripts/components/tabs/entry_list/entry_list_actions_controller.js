'use strict';

angular
  .module('contentful')

  .controller('EntryListActionsController', [
    '$scope',
    'require',
    function EntryListActionsController($scope, require) {
      const accessChecker = require('access_control/AccessChecker');
      const $controller = require('$controller');
      const spaceContext = require('spaceContext');
      const Analytics = require('analytics/Analytics.es6');

      const listActionsController = $controller('ListActionsController', {
        $scope: $scope,
        entityType: 'Entry'
      });

      $scope.showDuplicate = showDuplicate;
      $scope.duplicateSelected = duplicate;

      const controller = this;
      const publish = $scope.publishSelected;
      $scope.publishSelected = function(...args) {
        const contentTypes = getContentTypes();
        publish.apply(controller, args).then(results => {
          results.succeeded.forEach(entryEventTracker('publish', 'content-list', contentTypes));
        });
      };

      function showDuplicate() {
        return (
          !accessChecker.shouldHide('createEntry') && !accessChecker.shouldDisable('createEntry')
        );
      }

      function duplicate() {
        const contentTypes = getContentTypes();
        listActionsController.duplicate().then(results => {
          const succeeded = results.succeeded;
          succeeded.forEach(entryEventTracker('create', 'content-list__duplicate', contentTypes));
          $scope.entries.unshift(...succeeded);
          $scope.paginator.setTotal(total => total + succeeded.length);
          // instead of the stuff done above, we should call updateEntries here
          // and treat the server as the source of truth.
          // Just appending entries here for e.g., will not respect what the user
          // has sorted entries on the page by.
          // Calling updateEntries would alleviate this problem.
        });
      }

      // Returns an object having signature { [entryId]: [contentType] }.
      function getContentTypes() {
        return $scope.selection.getSelected().reduce((contentTypes, entry) => {
          const contentTypeId = entry.data.sys.contentType.sys.id;
          contentTypes[contentTypeId] = spaceContext.publishedCTs.get(contentTypeId);
          return contentTypes;
        }, {});
      }

      function entryEventTracker(action, origin, contentTypes) {
        return entry => {
          const event = 'entry:' + action; // entry:create, entry:publish
          Analytics.track(event, {
            eventOrigin: origin,
            contentType: contentTypes[entry.data.sys.contentType.sys.id],
            response: entry
          });
        };
      }
    }
  ]);
