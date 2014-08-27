'use strict';

angular.module('contentful').controller('AssetListCtrl',['$scope', '$injector', function AssetListCtrl($scope, $injector) {
  var $controller = $injector.get('$controller');
  var Selection   = $injector.get('Selection');
  var filepicker  = $injector.get('filepicker');
  var stringUtils = $injector.get('stringUtils');
  var $q          = $injector.get('$q');
  var listActions = $injector.get('listActions');
  var notification= $injector.get('notification');

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

  $scope.createMultipleAssets = function () {
    filepicker.pickMultiple().
    then(function (FPFiles) {
      listActions.serialize(_.map(FPFiles, createAssetForFile));

      _.defer(function () {
        $scope.searchController.resetAssets();
      }, 2000);
    }, function (FPError) {
      if (FPError.code !== 101) {
        throw new Error(FPError);
      }
    });
  };

  var throttledListRefresh = _.throttle(function () {
    _.delay(function () {
      $scope.searchController.resetAssets();
    }, 3000);
  }, 2000);

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
      return assetCallback.promise.then(function (entity) {
        var processCallback = $q.callback();
        entity.process(entity.version, locale, processCallback);
        processCallback.promise.then(function () {
          throttledListRefresh();
        }).catch(function () {
          notification.warn('Some assets failed to process');
        });
      }).catch(function (err) {
        notification.serverError('Some assets failed to upload', err);
      });
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

