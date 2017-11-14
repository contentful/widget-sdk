'use strict';
angular.module('contentful')
.controller('ListViewsController', [
  '$scope', 'require', 'getBlankView', 'resetList', 'preserveStateAs',
  function ($scope, require, getBlankView, resetList, preserveStateAs) {
    var createViewMigrator = require('data/ViewMigrator').default;
    var createViewPersistor = require('data/ListViewPersistor').default;
    var spaceContext = require('spaceContext');

    var viewMigrator = createViewMigrator(spaceContext.space, spaceContext.publishedCTs);
    var viewPersistor = createViewPersistor(
      spaceContext.getId(), viewMigrator, preserveStateAs);

    $scope.$watch('context.view', viewPersistor.save, true);
    $scope.loadView = loadView;

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
