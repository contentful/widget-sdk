import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { createSelection } from 'classes/Selection.es6';
import * as entityStatus from 'app/entity_editor/EntityStatus.es6';
import { getBlankAssetView as getBlankView } from 'data/UiConfig/Blanks.es6';
import * as EnvironmentUtils from 'utils/EnvironmentUtils.es6';

registerController('AssetListController', [
  '$scope',
  '$controller',
  '$state',
  'delay',
  'debounce',
  'spaceContext',
  'TheLocaleStore',
  'entityCreator',
  'analytics/Analytics.es6',
  'services/BulkAssetsCreator.es6',
  'utils/ResourceUtils.es6',
  'access_control/AccessChecker/index.es6',
  'app/ContentList/SavedViewsSidebar.es6',
  function AssetListController(
    $scope,
    $controller,
    $state,
    delay,
    debounce,
    spaceContext,
    TheLocaleStore,
    entityCreator,
    Analytics,
    BulkAssetsCreator,
    ResourceUtils,
    accessChecker,
    { default: createSavedViewsSidebar }
  ) {
    const searchController = $controller('AssetSearchController', { $scope: $scope });

    $controller('ListViewsController', {
      $scope: $scope,
      getBlankView,
      preserveStateAs: 'assets',
      resetList: function() {
        searchController.resetAssets(true);
      }
    });

    $scope.savedViewsSidebar = createSavedViewsSidebar({
      entityFolders: spaceContext.uiConfig.assets,
      loadView: function(view) {
        $scope.loadView(view);
      },
      getCurrentView: function() {
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

    $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(spaceContext.organization);
    $scope.isInsideMasterEnv = EnvironmentUtils.isInsideMasterEnv(spaceContext);

    const trackEnforcedButtonClick = err => {
      // If we get reason(s), that means an enforcement is present
      const reason = _.get(err, 'body.details.reasons', null);

      Analytics.track('entity_button:click', {
        entityType: 'asset',
        enforced: Boolean(reason),
        reason
      });
    };

    $scope.newAsset = () => {
      entityCreator
        .newAsset()
        .then(asset => {
          // X.list -> X.detail
          $state.go('^.detail', { assetId: asset.getId() });
        })
        .catch(err => {
          trackEnforcedButtonClick(err);

          // Throw err so the UI can also display it
          throw err;
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

    $scope.$watch(
      function pageParameters() {
        return {
          page: searchController.paginator.getPage(),
          pageLength: searchController.paginator.getPerPage(),
          spaceId: spaceContext.getId()
        };
      },
      (pageParameters, old) => {
        searchController.resetAssets(pageParameters.page === old.page);
      },
      true
    );

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
        return hasArchivedAssets(spaceContext.space).then(hasArchived => {
          $scope.hasArchivedAssets = hasArchived;
        });
      }
    });

    function hasArchivedAssets(space) {
      return space
        .getAssets({
          limit: 1,
          'sys.archivedAt[exists]': true
        })
        .then(response => response && response.total > 0);
    }

    $scope.createMultipleAssets = () => {
      const defaultLocaleCode = TheLocaleStore.getDefaultLocale().internal_code;
      BulkAssetsCreator.open(defaultLocaleCode).finally(() => {
        // We reload all assets to get the new ones. Unfortunately the
        // CMA is not immediately consistent so we have to wait.
        // TODO Instead of querying the collection endpoint we should
        // add the assets manually. This is currently not possible as the
        // asset's `process` endpoint doesn't give us the final `url`.
        delay(() => {
          searchController.resetAssets().then(() => {
            Notification.success('Updated asset list');
          });
        }, 5000);
      });
    };

    function getAssetDimensions(asset) {
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
    function getAssetFile(asset) {
      return spaceContext.getFieldValue(asset, 'file');
    }
  }
]);
