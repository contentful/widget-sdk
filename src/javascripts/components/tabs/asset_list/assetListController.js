import { registerController } from 'NgRegistry';
import _ from 'lodash';
import debounce from 'lodash/debounce';
import delay from 'lodash/delay';
import { Notification } from '@contentful/forma-36-react-components';
import { createSelection } from 'classes/Selection';
import * as entityStatus from 'app/entity_editor/EntityStatus';
import * as ResourceUtils from 'utils/ResourceUtils';
import { getBlankAssetView as getBlankView } from 'data/UiConfig/Blanks';

import TheLocaleStore from 'services/localeStore';
import createSavedViewsSidebar from 'app/ContentList/SavedViewsSidebar';
import * as accessChecker from 'access_control/AccessChecker';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';

export default function register() {
  registerController('AssetListController', [
    '$scope',
    '$controller',
    '$state',
    'spaceContext',
    function AssetListController($scope, $controller, $state, spaceContext) {
      const searchController = $controller('AssetSearchController', { $scope: $scope });

      $controller('ListViewsController', {
        $scope,
        entityType: 'Asset',
        getBlankView,
        resetList: () => searchController.resetAssets(true)
      });

      $scope.savedViewsState = 'loading';
      spaceContext.uiConfig.then(
        api => {
          $scope.savedViewsSidebar = createSavedViewsSidebar({
            entityFolders: api.assets,
            loadView: view => $scope.loadView(view),
            getCurrentView: () => _.cloneDeep(_.get($scope, ['context', 'view'], {}))
          });
          $scope.savedViewsState = 'ready';
        },
        () => {
          $scope.savedViewsState = 'error';
        }
      );

      $scope.entityStatus = entityStatus;

      $scope.shouldHide = accessChecker.shouldHide;
      $scope.shouldDisable = accessChecker.shouldDisable;
      $scope.canUploadMultipleAssets = accessChecker.canUploadMultipleAssets;
      $scope.searchController = searchController;
      $scope.selection = createSelection();
      $scope.getAssetDimensions = getAssetDimensions;
      $scope.paginator = searchController.paginator;

      $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(spaceContext.organization);
      $scope.isMasterEnvironment = spaceContext.isMasterEnvironment();

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
        Analytics.track('asset_list:add_asset_single');
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

      const resetPaginatorProps = () => {
        $scope.paginatorProps = {
          page: $scope.paginator.getPage(),
          pageCount: $scope.paginator.getPageCount(),
          select: page => {
            $scope.paginator.setPage(page);
            $scope.$applyAsync();
          }
        };
      };
      resetPaginatorProps();
      $scope.$watch('paginator.getPage()', resetPaginatorProps);
      $scope.$watch('paginator.getTotal()', resetPaginatorProps);

      // These are the props that are sent to the RecordsResourceUsage component
      const resetUsageProps = debounce(() => {
        $scope.usageProps = {
          space: spaceContext.space.data,
          environmentId: spaceContext.getEnvironmentId(),
          isMasterEnvironment: spaceContext.isMasterEnvironment(),
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
        Analytics.track('asset_list:add_asset_multiple');
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
}
