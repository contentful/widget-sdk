'use strict';

angular.module('contentful')
.controller('AssetListController', ['$scope', 'require', function AssetListController ($scope, require) {
  const $controller = require('$controller');
  const createSelection = require('selection');
  const delay = require('delay');
  const Analytics = require('analytics/Analytics');
  const notification = require('notification');
  const spaceContext = require('spaceContext');
  const accessChecker = require('access_control/AccessChecker');
  const entityStatus = require('entityStatus');
  const debounce = require('debounce');
  const getBlankView = require('data/UiConfig/Blanks').getBlankAssetView;
  const createSavedViewsSidebar = require('app/ContentList/SavedViewsSidebar').default;
  const BulkAssetsCreator = require('services/BulkAssetsCreator');
  const TheLocaleStore = require('TheLocaleStore');
  const entityCreator = require('entityCreator');
  const $state = require('$state');
  const ResourceUtils = require('utils/ResourceUtils');
  const EnvironmentUtils = require('utils/EnvironmentUtils');
  const createResourceService = require('services/ResourceService').default;

  const searchController = $controller('AssetSearchController', { $scope: $scope });

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

  const spaceId = spaceContext.space.data.sys.id;
  const organization = spaceContext.organizationContext.organization;

  $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(organization);
  $scope.isInsideMasterEnv = EnvironmentUtils.isInsideMasterEnv(spaceContext);

  const resources = createResourceService(spaceId);

  const trackButtonClick = debounce(() => {
    // Track the new asset button click, with usage
    //
    // This should happen before the call to the CMA to check if the asset(s) can be
    // created occurs, so that the click with usage can be registered

    return resources.get('record').then(recordResource => {
      Analytics.track('entity_button:click', {
        entityType: 'asset',
        usage: recordResource.usage,
        limit: ResourceUtils.getResourceLimits(recordResource).maximum
      });
    });
  });

  $scope.newAsset = () => {
    trackButtonClick();
    entityCreator.newAsset().then(asset => {
      // X.list -> X.detail
      $state.go('^.detail', {assetId: asset.getId()});
    });
  };

  // These are the props that are sent to the RecordsResourceUsage component
  const resetUsageProps = debounce(() => {
    $scope.usageProps = {
      space: spaceContext.space.data,
      currentTotal: $scope.paginator.getTotal()
    };
  });

  resetUsageProps();

  const debouncedResetAssets = debounce(() => {
    searchController.resetAssets();
    resetUsageProps();
  }, 3000);

  $scope.$watch('paginator.getTotal()', debouncedResetAssets);

  $scope.$watch(function pageParameters () {
    return {
      page: searchController.paginator.getPage(),
      pageLength: searchController.paginator.getPerPage(),
      spaceId: spaceContext.getId()
    };
  }, (pageParameters, old) => {
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
  $scope.hasNoSearchResults = () => {
    const hasQuery = searchController.hasQuery();
    const hasAssets = $scope.paginator.getTotal() > 0;
    return !hasAssets && hasQuery && !$scope.context.isSearching;
  };


  // TODO this code is duplicated in the entry list controller
  $scope.showNoAssetsAdvice = () => {
    const hasQuery = searchController.hasQuery();
    const hasAssets = $scope.paginator.getTotal() > 0;

    return !hasAssets && !hasQuery && !$scope.context.isSearching;
  };

  $scope.getAssetFile = getAssetFile;

  $scope.$watch('showNoAssetsAdvice()', show => {
    if (show) {
      $scope.hasArchivedAssets = false;
      return hasArchivedAssets(spaceContext.space)
      .then(hasArchived => {
        $scope.hasArchivedAssets = hasArchived;
      });
    }
  });

  function hasArchivedAssets (space) {
    return space.getAssets({
      'limit': 1,
      'sys.archivedAt[exists]': true
    }).then(response => response && response.total > 0);
  }

  $scope.createMultipleAssets = () => {
    trackButtonClick();

    const defaultLocaleCode = TheLocaleStore.getDefaultLocale().internal_code;
    BulkAssetsCreator.open(defaultLocaleCode).finally(() => {
      // We reload all assets to get the new ones. Unfortunately the
      // CMA is not immediately consistent so we have to wait.
      // TODO Instead of querying the collection endpoint we should
      // add the assets manually. This is currently not possible as the
      // asset's `process` endpoint doesn't give us the final `url`.
      delay(() => {
        searchController.resetAssets().then(() => {
          notification.info('Updated asset list');
        });
      }, 5000);
    });
  };

  function getAssetDimensions (asset) {
    const file = getAssetFile(asset);
    const width = _.get(file, 'details.image.width', false);
    const height = _.get(file, 'details.image.height', false);

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
