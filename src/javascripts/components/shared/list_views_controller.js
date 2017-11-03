'use strict';
angular.module('contentful')
.controller('ListViewsController', [
  '$scope', 'require', 'getBlankView', 'resetList', 'preserveStateAs',
  function ($scope, require, getBlankView, resetList, preserveStateAs) {
    var createViewPersistor = require('data/ListViewPersistor').default;
    var spaceContext = require('spaceContext');

    var viewPersistor = createViewPersistor(
      spaceContext.space, spaceContext.publishedCTs, preserveStateAs);

    $scope.$watch('context.view', viewPersistor.save, true);
    $scope.loadView = loadView;

    if (preserveStateAs === 'assets') {
      // TODO: Remove when migrating assets search!
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
