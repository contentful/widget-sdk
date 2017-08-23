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
    var K = require('utils/kefir');

    var getCurrentView = $parse('context.view');
    var setCurrentView = getCurrentView.assign;

    var hiddenContentTypes = [];

    if (preserveStateAs) {
      var viewPersistor = createViewPersistor(spaceContext.getId(), preserveStateAs);
      var collections = K.getValue(spaceContext.contentCollections.state$);
      replaceView(viewPersistor.read(collections));
      $scope.$watch('context.view', viewPersistor.save, true);
    }

    setCurrentView($scope, getCurrentView($scope) || getBlankView());

    $scope.$watch(function () {
      return spaceContext.uiConfig.get();
    }, function (uiConfig) {
      $scope.uiConfig = uiConfig;
      if (uiConfig && !uiConfig[viewCollectionName]) {
        // TODO This should be handled in the UiConfigRepo when the
        // data is loaded.
        uiConfig[viewCollectionName] = generateDefaultViews(true);
      }
    });

    $scope.$watch('uiConfig', cacheInaccessibleContentTypes, true);
    $scope.$watch(accessChecker.getResponses, cacheInaccessibleContentTypes);

    // TODO Move this to UiConfigRepo
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
      return spaceContext.uiConfig.save($scope.uiConfig).catch(function (err) {
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
