import { registerController } from 'NgRegistry.es6';

import * as Analytics from 'analytics/Analytics';
import * as accessChecker from 'access_control/AccessChecker';
import * as logger from 'services/logger.es6';

export default function register() {
  registerController('EntryListActionsController', [
    '$scope',
    '$controller',
    'spaceContext',
    function EntryListActionsController($scope, $controller, spaceContext) {
      const listActionsController = $controller('ListActionsController', {
        $scope: $scope,
        entityType: 'Entry'
      });

      $scope.showDuplicate = showDuplicate;
      $scope.duplicateSelected = duplicate;

      const controller = this;
      const publish = $scope.publishSelected;
      $scope.publishSelected = function(...args) {
        return publish.apply(controller, args).then(results => {
          results.succeeded.forEach(entryEventTracker('publish', 'content-list'));
        });
      };

      function showDuplicate() {
        return (
          !accessChecker.shouldHide('create', 'entry') &&
          !accessChecker.shouldDisable('create', 'entry')
        );
      }

      function duplicate() {
        return listActionsController.duplicate().then(results => {
          const succeeded = results.succeeded;
          succeeded.forEach(entryEventTracker('create', 'content-list__duplicate'));
          $scope.entries.unshift(...succeeded);
          $scope.paginator.setTotal(total => total + succeeded.length);
          // instead of the stuff done above, we should call updateEntries here
          // and treat the server as the source of truth.
          // Just appending entries here for e.g., will not respect what the user
          // has sorted entries on the page by.
          // Calling updateEntries would alleviate this problem.
        });
      }

      function entryEventTracker(action, origin) {
        return entry => {
          try {
            const event = 'entry:' + action; // entry:create, entry:publish
            const contentTypeId = entry.data.sys.contentType.sys.id;
            const contentType = spaceContext.publishedCTs.get(contentTypeId).data;
            Analytics.track(event, {
              eventOrigin: origin,
              contentType,
              response: entry.data
            });
          } catch (error) {
            logger.logError('Unexpected error during entryEventTracker call', {
              err: error,
              msg: error.message
            });
          }
        };
      }
    }
  ]);
}
