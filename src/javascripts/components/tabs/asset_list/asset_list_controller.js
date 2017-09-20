'use strict';

angular.module('contentful')
.controller('AssetListController', ['$scope', 'require', function AssetListController ($scope, require) {
  var $controller = require('$controller');
  var $q = require('$q');
  var createSelection = require('selection');
  var delay = require('delay');
  var filepicker = require('filepicker');
  var logger = require('logger');
  var notification = require('notification');
  var stringUtils = require('stringUtils');
  var TheLocaleStore = require('TheLocaleStore');
  var spaceContext = require('spaceContext');
  var accessChecker = require('accessChecker');
  var entityStatus = require('entityStatus');
  var debounce = require('debounce');
  var Notification = require('notification');
  var getBlankView = require('data/UiConfig/Blanks').getBlankAssetView;
  var initSavedViewsComponent = require('app/ContentList/SavedViewsComponent').default;

  $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    preserveStateAs: 'assets',
    resetList: function () {
      $scope.searchController.resetAssets(true);
    }
  });

  $scope.savedViewsComponent = initSavedViewsComponent({
    spaceContext: spaceContext,
    scopedUiConfig: spaceContext.uiConfig.forAssets(),
    loadView: function (view) {
      $scope.loadView(view);
    },
    getCurrentView: function () {
      return _.cloneDeep(_.get($scope, ['context', 'view'], {}));
    }
  });

  $scope.entityStatus = entityStatus;

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;
  $scope.canUploadMultipleAssets = accessChecker.canUploadMultipleAssets;

  $scope.searchController = $controller('AssetSearchController', {
    $scope: $scope,
    getSearchTerm: getSearchTerm
  });

  $scope.selection = createSelection();
  $scope.getAssetDimensions = getAssetDimensions;
  $scope.paginator = $scope.searchController.paginator;

  var debouncedResetAssets = debounce(function () {
    $scope.searchController.resetAssets();
  }, 3000);

  $scope.$watch('paginator.getTotal()', debouncedResetAssets);

  $scope.$watch(function pageParameters () {
    return {
      searchTerm: $scope.context.view.searchTerm,
      page: $scope.searchController.paginator.getPage(),
      pageLength: $scope.searchController.paginator.getPerPage(),
      spaceId: spaceContext.getId()
    };
  }, function (pageParameters, old, scope) {
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);


  /**
   * @ngdoc method
   * @name AssetListController#$scope.hasNoSearchResult
   * @description
   * Returns true if the user has provided a query but no results have
   * been returned from the API.
   *
   * @return {boolean}
   */
  // TODO this code is duplicated in the entry list controller
  $scope.hasNoSearchResults = function () {
    var hasQuery = !_.isEmpty($scope.context.view.searchTerm);
    var hasAssets = $scope.paginator.getTotal() > 0;
    return !hasAssets && hasQuery && !$scope.context.isSearching;
  };


  // TODO this code is duplicated in the entry list controller
  $scope.showNoAssetsAdvice = function () {
    var hasQuery = !_.isEmpty($scope.context.view.searchTerm);
    var hasAssets = $scope.paginator.getTotal() > 0;

    return !hasAssets && !hasQuery && !$scope.context.isSearching;
  };

  $scope.getAssetFile = getAssetFile;

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
    filepicker.pickMultiple()
    .then(uploadFPFiles, function (FPError) {
      if (FPError.code !== 101) {
        // TODO Demote this to a warning if we cannot fix this.
        logger.logError('filepicker.pickMultiple failed', {
          fpError: FPError
        });
        Notification.error(
          'An error occured while uploading multiple assets. ' +
          'Please contact support if this problem persists.'
        );
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
        $scope.searchController.resetAssets().then(function () {
          notification.info('Updated asset list');
        });
      }, 5000);
    })
    .then(function (entities) {
      entities = _.filter(entities);
      notification.info('Assets uploaded. Processing...');
      return $q.all(_.map(entities, processAssetForFile)).then(function () {
        notification.info('Assets processed. Updating...');
      }).catch(function (err) {
        notification.warn('Some assets failed to process');
        return $q.reject(err);
      });
    }, function (err) {
      logger.logServerWarn('Some assets failed to upload', {error: err});
      notification.error('Some assets failed to upload');
      return $q.reject(err);
    });
  }

  function createAssetForFile (FPFile) {
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

  function processAssetForFile (entity) {
    var locale = TheLocaleStore.getDefaultLocale().internal_code;
    return entity.process(entity.version, locale);
  }

  function getSearchTerm () {
    return $scope.context.view.searchTerm;
  }

  function getAssetDimensions (asset) {
    var file = getAssetFile(asset);
    var width = _.get(file, 'details.image.width', false);
    var height = _.get(file, 'details.image.height', false);

    if (width && height) {
      return width + ' &times; ' + height + '&thinsp;px';
    } else {
      return '&ndash;'; // default to dash
    }
  }

  // Get the default asset file for the default locale
  function getAssetFile (asset) {
    return spaceContext.getFieldValue(asset, 'file');
  }
}]);
