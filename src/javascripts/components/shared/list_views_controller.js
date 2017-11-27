'use strict';
angular.module('contentful')
.controller('ListViewsController', [
  '$scope', 'require', 'getBlankView', 'resetList', 'preserveStateAs',
  function ($scope, require, getBlankView, resetList, preserveStateAs) {
    var createViewMigrator = require('data/ViewMigrator').default;
    var createViewPersistor = require('data/ListViewPersistor').default;
    var spaceContext = require('spaceContext');
    var Notification = require('notification');

    var viewMigrator = createViewMigrator(spaceContext.space, spaceContext.publishedCTs);
    var viewPersistor = createViewPersistor(
      spaceContext.getId(), viewMigrator, preserveStateAs);

    $scope.$watch('context.view', viewPersistor.save, true);
    $scope.loadView = loadView;

    viewPersistor.read().then(loadView);

    function loadView (view) {
      view = handleViewMigrationIssues(view);
      replaceView(view);
      resetList();
    }

    function replaceView (view) {
      view = _.extend(getBlankView(), _.cloneDeep(view || {}));
      _.set($scope, ['context', 'view'], view);
    }

    function handleViewMigrationIssues (view) {
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

    function showViewMigrationFailedNotification (view) {
      var isAdmin = spaceContext.getData('spaceMembership.admin', false);
      var contactPerson = isAdmin ? 'support' : 'your administrator';
      var intro = 'There is a problem with your ' + (
        view.title ? '“' + view.title + '” view' : 'current search');
      Notification.error(intro + ', which has been reported. If the problem ' +
        'persists, contact ' + contactPerson + '.');
    }
  }]);
