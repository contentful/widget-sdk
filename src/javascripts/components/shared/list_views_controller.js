'use strict';
angular.module('contentful')
.controller('ListViewsController', [
  '$scope', 'require', 'generateDefaultViews', 'getBlankView', 'resetList', 'viewCollectionName', 'preserveStateAs',
  function ($scope, require, generateDefaultViews, getBlankView, resetList, viewCollectionName, preserveStateAs) {
    var $q = require('$q');
    var logger = require('logger');
    var notification = require('notification');
    var $parse = require('$parse');
    var createViewPersistor = require('data/ListViewPersistor').default;
    var accessChecker = require('accessChecker');
    var spaceContext = require('spaceContext');
    var Tracking = require('analytics/events/SearchAndViews');

    var getCurrentView = $parse('context.view');
    var setCurrentView = getCurrentView.assign;

    var hiddenContentTypes = [];

    if (preserveStateAs) {
      var viewPersistor = createViewPersistor(spaceContext.getId(), preserveStateAs);
      replaceView(viewPersistor.read());
      $scope.$watch('context.view', viewPersistor.save, true);
    }

    setCurrentView($scope, getCurrentView($scope) || getBlankView());

    $scope.$watch('uiConfig', function (uiConfig) {
      if (uiConfig && !uiConfig[viewCollectionName]) {
        uiConfig[viewCollectionName] = generateDefaultViews(true);
      }
    });

    $scope.$watch('uiConfig', cacheInaccessibleContentTypes, true);
    $scope.$watch(accessChecker.getResponses, cacheInaccessibleContentTypes);

    $scope.resetViews = function () {
      $scope.uiConfig[viewCollectionName] = generateDefaultViews();
      $scope.saveViews();
    };

    $scope.clearView = function () {
      setCurrentView($scope, getBlankView());
      resetList();
    };

    $scope.loadView = function (view) {
      replaceView(view);
      resetList();
      Tracking.viewLoaded(view);
    };

    $scope.saveViews = function () {
      return $scope.saveUiConfig().catch(function (err) {
        logger.logServerWarn('Error trying to save view', { error: err });
        notification.error('Error trying to save view');
        return $q.reject(err);
      });
    };

    $scope.viewIsHidden = function (view) {
      return view && view.contentTypeId && hiddenContentTypes.indexOf(view.contentTypeId) > -1;
    };

    function replaceView (view) {
      var newView = _.extend(getBlankView(), _.cloneDeep(view));
      newView.title = 'New View';
      setCurrentView($scope, newView);
    }

    function cacheInaccessibleContentTypes () {
      if (!$scope.uiConfig) { return; }

      hiddenContentTypes = [];

      _.forEach($scope.uiConfig[viewCollectionName], function (group) {
        _(group.views || [])
      .filter(function (view) { return _.isString(view.contentTypeId); })
      .forEach(function (view) {
        if (!accessChecker.canPerformActionOnEntryOfType('read', view.contentTypeId)) {
          hiddenContentTypes.push(view.contentTypeId);
        }
      });
      });
    }
  }]);
