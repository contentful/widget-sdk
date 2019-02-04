import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { Status, statusQueryKey } from 'app/ContentList/Search/Filters.es6';
import { Operator } from 'app/ContentList/Search/Operators.es6';

export default function register() {
  registerController('ListViewsController', [
    '$scope',
    'getBlankView',
    'resetList',
    'preserveStateAs',
    'spaceContext',
    'data/ListViewPersistor.es6',
    'saved-views-migrator',
    (
      $scope,
      getBlankView,
      resetList,
      preserveStateAs,
      spaceContext,
      { default: createViewPersistor },
      { create: createViewMigrator }
    ) => {
      const viewMigrator = createViewMigrator(
        spaceContext.publishedCTs.getAllBare(),
        spaceContext.users.getAll
      );
      const viewPersistor = createViewPersistor(
        spaceContext.getId(),
        viewMigrator,
        preserveStateAs
      );

      $scope.$watch('context.view', viewPersistor.save, true);
      $scope.loadView = loadView;

      $scope.loadArchived = () => {
        loadView({ searchFilters: [[statusQueryKey, Operator.EQUALS, Status.Archived]] });
      };

      viewPersistor.read().then(loadView);

      function loadView(view) {
        view = handleViewMigrationIssues(view);
        replaceView(view);
        resetList();
      }

      function replaceView(view) {
        view = _.extend(getBlankView(), _.cloneDeep(view || {}));
        _.set($scope, ['context', 'view'], view);
      }

      function handleViewMigrationIssues(view) {
        if (view && view._legacySearchTerm) {
          view = _.clone(view);
          showViewMigrationFailedNotification(view);
          // `searchTerm` migration has unexpectedly failed for this view.
          // Treat the old `searchTerm` as free form search text for now.
          view.searchText = view._legacySearchTerm;
          delete view._legacySearchTerm;
        }
        return view;
      }

      function showViewMigrationFailedNotification(view) {
        const isAdmin = spaceContext.getData('spaceMembership.admin', false);
        const contactPerson = isAdmin ? 'support' : 'your administrator';
        const intro =
          'There is a problem with your ' +
          (view.title ? '“' + view.title + '” view' : 'current search');
        Notification.error(
          intro +
            ', which has been reported. If the problem ' +
            'persists, contact ' +
            contactPerson +
            '.'
        );
      }
    }
  ]);
}
