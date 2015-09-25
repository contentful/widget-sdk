'use strict';

angular.module('contentful').controller('AssetListController',['$scope', '$injector', function AssetListController($scope, $injector) {
  var $controller    = $injector.get('$controller');
  var $q             = $injector.get('$q');
  var Selection      = $injector.get('Selection');
  var delay          = $injector.get('delay');
  var filepicker     = $injector.get('filepicker');
  var logger         = $injector.get('logger');
  var notification   = $injector.get('notification');
  var stringUtils    = $injector.get('stringUtils');
  var throttle       = $injector.get('throttle');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  $controller('AssetListViewsController', {
    $scope: $scope,
    currentViewLocation: 'context.view'
  });

  $scope.entityStatusController = $controller('EntityStatusController', {$scope: $scope});

  $scope.searchController = $controller('AssetSearchController', {
    $scope:         $scope,
    getSearchTerm:  getSearchTerm
  });

  $scope.selection = new Selection();
  $scope.getAssetDimensions = getAssetDimensions;

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm:  scope.context.view.searchTerm,
      page:        scope.searchController.paginator.page,
      pageLength:  scope.searchController.paginator.pageLength,
      spaceId:     (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);

  // TODO this code is duplicated in the asset list controller
  $scope.visibleInCurrentList = function(asset){
    // TODO: This needs to basically emulate the API :(
    return !asset.isDeleted();
  };

  // TODO this code is duplicated in the asset list controller
  $scope.showNoAssetsAdvice = function () {
    var view = $scope.context.view;
    var hasQuery = !_.isEmpty(view.searchTerm);
    var hasEntries = $scope.assets && $scope.assets.length > 0;
    return !hasEntries && !hasQuery;
  };

  // TODO this code is duplicated in the asset list controller
  $scope.showCreateAssetButton = function () {
    return !$scope.permissionController.get('createAsset', 'shouldHide');
  };

  var throttledListRefresh = throttle(function () {
    delay(function () {
      $scope.searchController.resetAssets();
    }, 3000);
  }, 2000);

  $scope.createMultipleAssets = function () {
    filepicker.pickMultiple().
    then(function (FPFiles) {
      return $q.all(_.map(FPFiles, createAssetForFile)).then(function (entities) {
        entities = _.filter(entities);
        notification.info('Assets uploaded. Processing...');
        throttledListRefresh();
        return $q.all(_.map(entities, processAssetForFile)).then(function () {
          notification.info('Assets processed');
          throttledListRefresh();
        }).catch(function (err) {
          notification.warn('Some assets failed to process');
          throttledListRefresh();
          return $q.reject(err);
        });
      }).catch(function (err) {
        logger.logServerWarn('Some assets failed to upload', {error: err });
        notification.error('Some assets failed to upload');
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
    var file = filepicker.parseFPFile(FPFile);
    var locale = TheLocaleStore.getDefaultLocale().internal_code;
    var data = {
      sys: { type: 'Asset' },
      fields: { file: {}, title: {} }
    };
    data.fields.file[locale] = file;
    data.fields.title[locale] = stringUtils.fileNameToTitle(file.fileName);

    return $scope.spaceContext.space.createAsset(data);
  }

  function processAssetForFile(entity) {
    var locale = TheLocaleStore.getDefaultLocale().internal_code;
    return entity.process(entity.version, locale);
  }

  $scope.$on('didResetAssets', function (event, assets) {
    $scope.selection.switchBaseSet(assets.length);
  });

  $scope.$on('didLoadMoreAssets', function (event, assets) {
    $scope.selection.setBaseSize(assets.length);
  });

  function getSearchTerm() {
    return $scope.context.view.searchTerm;
  }

  function getAssetDimensions(asset) {
    var file, width, height;

    // @todo due to buggy implementation, "localizedField" may throw TypeError
    try {
      file = $scope.spaceContext.localizedField(asset, 'data.fields.file');
    } catch (e) {}

    width = dotty.get(file, 'details.image.width', false);
    height = dotty.get(file, 'details.image.height', false);

    if (width && height) {
      return width + ' &times; ' + height + '&thinsp;px';
    }
    return '&ndash;'; // default to dash
  }

}]);
