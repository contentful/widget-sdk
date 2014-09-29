'use strict';

angular.module('contentful').controller('AssetListCtrl',['$scope', '$injector', function AssetListCtrl($scope, $injector) {
  var $controller = $injector.get('$controller');
  var Selection   = $injector.get('Selection');
  var filepicker  = $injector.get('filepicker');
  var stringUtils = $injector.get('stringUtils');
  var $q          = $injector.get('$q');
  var listActions = $injector.get('listActions');
  var notification= $injector.get('notification');
  var delay       = $injector.get('delay');
  var throttle    = $injector.get('throttle');

  $controller('AssetListViewsController', {
    $scope: $scope,
    currentViewLocation: 'tab.params.view'
  });
  $scope.searchController = $controller('AssetSearchController', {
    $scope:         $scope,
    getSearchTerm:  getSearchTerm
  });

  $scope.selection = new Selection();

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm:  scope.tab.params.view.searchTerm,
      page:        scope.searchController.paginator.page,
      pageLength:  scope.searchController.paginator.pageLength,
      spaceId:     (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);

  $scope.visibleInCurrentList = function(){
    // TODO: This needs to basically emulate the API :(
    return true;
  };

  $scope.hasQuery = function () {
    return !_.isEmpty($scope.tab.params.view.searchTerm);
  };

  $scope.statusClass = function(asset){
    if (asset.isPublished()) {
      if (asset.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'published';
      }
    } else if (asset.isArchived()) {
      return 'archived';
    } else {
      return 'draft';
    }
  };

  var throttledListRefresh = throttle(function () {
    delay(function () {
      $scope.searchController.resetAssets();
    }, 3000);
  }, 2000);

  $scope.createMultipleAssets = function () {
    filepicker.pickMultiple().
    then(function (FPFiles) {
      return listActions.serialize(_.map(FPFiles, createAssetForFile)).then(function (entities) {
        entities = _.filter(entities);
        notification.info('Assets uploaded. Processing...');
        throttledListRefresh();
        return listActions.serialize(_.map(entities, processAssetForFile)).then(function () {
          notification.info('Assets processed');
          throttledListRefresh();
          return listActions.serialize(_.map(entities, publishAssetForFile)).then(function () {
            notification.info('Assets saved');
            throttledListRefresh();
          }).catch(function (err) {
            notification.warn('Some assets failed to save');
            throttledListRefresh();
            return $q.reject(err);
          });
        }).catch(function (err) {
          notification.warn('Some assets failed to process');
          throttledListRefresh();
          return $q.reject(err);
        });
      }).catch(function (err) {
        notification.serverError('Some assets failed to upload', err);
        throttledListRefresh();
        return $q.reject(err);
      });
    }, function (FPError) {
      if (FPError.code !== 101) {
        throw new Error(FPError);
      }
    });
  };

  function createAssetForFile(FPFile) {
    return function () {
      var assetCallback = $q.callback();
      var file = filepicker.parseFPFile(FPFile);
      var locale = $scope.spaceContext.space.getDefaultLocale().code;
      var data = {
        sys: { type: 'Asset' },
        fields: { file: {}, title: {} }
      };
      data.fields.file[locale] = file;
      data.fields.title[locale] = stringUtils.fileNameToTitle(file.fileName);

      $scope.spaceContext.space.createAsset(data, assetCallback);
      return assetCallback.promise;
    };
  }

  function processAssetForFile(entity) {
    return function () {
      var processCallback = $q.callback();
      var locale = $scope.spaceContext.space.getDefaultLocale().code;
      entity.process(entity.version, locale, processCallback);
      return processCallback.promise;
    };
  }

  function publishAssetForFile(entity) {
    return function () {
      var publishCallback = $q.callback();
      entity.publish(entity.getVersion()+1, publishCallback);
      return publishCallback.promise;
    };
  }


  $scope.$on('didResetAssets', function (event, assets) {
    $scope.selection.switchBaseSet(assets.length);
  });

  $scope.$on('didLoadMoreAssets', function (event, assets) {
    $scope.selection.setBaseSize(assets.length);
  });

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.searchController.resetAssets();
  });

  function getSearchTerm() {
    return $scope.tab.params.view.searchTerm;
  }

}]);

