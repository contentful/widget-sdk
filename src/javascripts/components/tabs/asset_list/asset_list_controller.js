'use strict';

angular.module('contentful').controller('AssetListController',['$scope', '$injector', function AssetListController($scope, $injector) {
  var $controller     = $injector.get('$controller');
  var $q              = $injector.get('$q');
  var createSelection = $injector.get('selection');
  var delay           = $injector.get('delay');
  var filepicker      = $injector.get('filepicker');
  var logger          = $injector.get('logger');
  var notification    = $injector.get('notification');
  var stringUtils     = $injector.get('stringUtils');
  var TheLocaleStore  = $injector.get('TheLocaleStore');
  var spaceContext    = $injector.get('spaceContext');
  var accessChecker   = $injector.get('accessChecker');

  $controller('AssetListViewsController', {
    $scope: $scope,
    preserveState: true
  });

  $scope.entityStatusController = $controller('EntityStatusController', { $scope: $scope });

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;
  $scope.canUploadMultipleAssets = accessChecker.canUploadMultipleAssets;

  $scope.searchController = $controller('AssetSearchController', {
    $scope: $scope,
    getSearchTerm: getSearchTerm
  });

  $scope.selection = createSelection();
  $scope.getAssetDimensions = getAssetDimensions;

  $scope.$watch(function pageParameters(){
    return {
      searchTerm:  $scope.context.view.searchTerm,
      page:        $scope.searchController.paginator.page,
      pageLength:  $scope.searchController.paginator.pageLength,
      spaceId:     spaceContext.getId()
    };
  }, function(pageParameters, old, scope){
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);

  // TODO this code is duplicated in the entry list controller
  $scope.visibleInCurrentList = function(asset){
    // TODO: This needs to basically emulate the API :(
    return !asset.isDeleted();
  };

  // TODO this code is duplicated in the entry list controller
  $scope.showNoAssetsAdvice = function () {
    var view = $scope.context.view;
    var hasQuery = !_.isEmpty(view.searchTerm);
    var hasEntries = $scope.assets && $scope.assets.length > 0;
    return !hasEntries && !hasQuery && !$scope.context.loading;
  };

  $scope.$watch('showNoAssetsAdvice()', function (show) {
    if (show) {
      $scope.hasArchivedAssets = false;
      return hasArchivedAssets(spaceContext.space)
      .then(function (hasArchived) {
        $scope.hasArchivedAssets = hasArchived;
      });
    }
  });

  function hasArchivedAssets (space) {
    return space.getAssets({
      'limit': 1,
      'sys.archivedAt[exists]': true
    }).then(function (response) {
      return response && response.total > 0;
    });
  }

  $scope.createMultipleAssets = function () {
    filepicker.pickMultiple().
    then(uploadFPFiles, function (FPError) {
      if (FPError.code !== 101) {
        throw new Error(FPError);
      }
    });
  };

  function uploadFPFiles (fpFiles) {
    return $q.all(_.map(fpFiles, createAssetForFile))
    .finally(function () {
      // We reload all assets to get the new ones. Unfortunately the
      // CMA is not immediately consistent so we have to wait.
      // TODO Instead of querying the collection endpoint we should
      // add the assets manually
      delay(function () {
        $scope.searchController.resetAssets();
      }, 5000);
    })
    .then(function (entities) {
      entities = _.filter(entities);
      notification.info('Assets uploaded. Processing...');
      return $q.all(_.map(entities, processAssetForFile)).then(function () {
        notification.info('Assets processed');
      }).catch(function (err) {
        notification.warn('Some assets failed to process');
        return $q.reject(err);
      });
    }, function (err) {
      logger.logServerWarn('Some assets failed to upload', {error: err });
      notification.error('Some assets failed to upload');
      return $q.reject(err);
    });
  }

  function createAssetForFile(FPFile) {
    var file = filepicker.parseFPFile(FPFile);
    var locale = TheLocaleStore.getDefaultLocale().internal_code;
    var data = {
      sys: { type: 'Asset' },
      fields: { file: {}, title: {} }
    };
    data.fields.file[locale] = file;
    data.fields.title[locale] = stringUtils.fileNameToTitle(file.fileName);

    return spaceContext.space.createAsset(data);
  }

  function processAssetForFile(entity) {
    var locale = TheLocaleStore.getDefaultLocale().internal_code;
    return entity.process(entity.version, locale);
  }

  function getSearchTerm() {
    return $scope.context.view.searchTerm;
  }

  function getAssetDimensions(asset) {
    var file = spaceContext.localizedField(asset, 'data.fields.file');
    var width = dotty.get(file, 'details.image.width', false);
    var height = dotty.get(file, 'details.image.height', false);

    if (width && height) {
      return width + ' &times; ' + height + '&thinsp;px';
    } else {
      return '&ndash;'; // default to dash
    }
  }

}]);
