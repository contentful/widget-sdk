'use strict';
angular.module('contentful').controller('ListViewsController', [
  '$scope',
  'require',
  'getBlankView',
  'resetList',
  'preserveStateAs',
  ($scope, require, getBlankView, resetList, preserveStateAs) => {
    const createViewMigrator = require('data/ViewMigrator.es6').default;
    const createViewPersistor = require('data/ListViewPersistor.es6').default;
    const { Status, statusQueryKey } = require('app/ContentList/Search/Filters.es6');
    const { Operator } = require('app/ContentList/Search/Operators.es6');
    const spaceContext = require('spaceContext');
    const Notification = require('notification');

    const viewMigrator = createViewMigrator(spaceContext.space, spaceContext.publishedCTs);
    const viewPersistor = createViewPersistor(spaceContext.getId(), viewMigrator, preserveStateAs);

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
