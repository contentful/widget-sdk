'use strict';

angular.module('contentful')
.controller('AssetListController', ['$scope', 'require', function AssetListController ($scope, require) {
  var $controller = require('$controller');
  var createSelection = require('selection');
  var delay = require('delay');
  var notification = require('notification');
  var spaceContext = require('spaceContext');
  var accessChecker = require('access_control/AccessChecker');
  var entityStatus = require('entityStatus');
  var debounce = require('debounce');
  var getBlankView = require('data/UiConfig/Blanks').getBlankAssetView;
  var createSavedViewsSidebar = require('app/ContentList/SavedViewsSidebar').default;
  var BulkAssetsCreator = require('services/BulkAssetsCreator');
  var TheLocaleStore = require('TheLocaleStore');

  var searchController = $controller('AssetSearchController', { $scope: $scope });

  $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    preserveStateAs: 'assets',
    resetList: function () {
      searchController.resetAssets(true);
    }
  });

  $scope.savedViewsSidebar = createSavedViewsSidebar({
    entityFolders: spaceContext.uiConfig.assets,
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
  $scope.searchController = searchController;
  $scope.selection = createSelection();
  $scope.getAssetDimensions = getAssetDimensions;
  $scope.paginator = searchController.paginator;

  var debouncedResetAssets = debounce(function () {
    searchController.resetAssets();
  }, 3000);

  $scope.$watch('paginator.getTotal()', debouncedResetAssets);

  $scope.$watch(function pageParameters () {
    return {
      page: searchController.paginator.getPage(),
      pageLength: searchController.paginator.getPerPage(),
      spaceId: spaceContext.getId()
    };
  }, function (pageParameters, old) {
    searchController.resetAssets(pageParameters.page === old.page);
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
    var hasQuery = searchController.hasQuery();
    var hasAssets = $scope.paginator.getTotal() > 0;
    return !hasAssets && hasQuery && !$scope.context.isSearching;
  };


  // TODO this code is duplicated in the entry list controller
  $scope.showNoAssetsAdvice = function () {
    var hasQuery = searchController.hasQuery();
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
    var defaultLocaleCode = TheLocaleStore.getDefaultLocale().internal_code;
    BulkAssetsCreator.open(defaultLocaleCode).finally(function () {
      // We reload all assets to get the new ones. Unfortunately the
      // CMA is not immediately consistent so we have to wait.
      // TODO Instead of querying the collection endpoint we should
      // add the assets manually. This is currently not possible as the
      // asset's `process` endpoint doesn't give us the final `url`.
      delay(function () {
        searchController.resetAssets().then(function () {
          notification.info('Updated asset list');
        });
      }, 5000);
    });
  };

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
