'use strict';
angular.module('contentful')
.controller('ListViewsController', [
  '$scope', 'require', 'getBlankView', 'resetList', 'preserveStateAs',
  function ($scope, require, getBlankView, resetList, preserveStateAs) {
    var createViewMigrator = require('data/ViewMigrator').default;
    var createViewPersistor = require('data/ListViewPersistor').default;
    var spaceContext = require('spaceContext');

    // TODO: Remove differentiation when migrating assets search!
    var isMigratedView = preserveStateAs === 'entries';

    var viewMigrator = isMigratedView
      ? createViewMigrator(spaceContext.space, spaceContext.publishedCTs)
      : null;
    var viewPersistor = createViewPersistor(
      spaceContext.getId(), viewMigrator, preserveStateAs);

    $scope.$watch('context.view', viewPersistor.save, true);
    $scope.loadView = loadView;

    if (!isMigratedView) {
      replaceView({});
    }
    viewPersistor.read().then(loadView);

    function loadView (view) {
      replaceView(view);
      resetList();
    }

    function replaceView (view) {
      view = _.extend(getBlankView(), _.cloneDeep(view || {}));
      _.set($scope, ['context', 'view'], view);
    }
  }]);
