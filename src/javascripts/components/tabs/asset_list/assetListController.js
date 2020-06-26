import { registerController } from 'core/NgRegistry';
import _ from 'lodash';
import debounce from 'lodash/debounce';
import delay from 'lodash/delay';
import { Notification } from '@contentful/forma-36-react-components';
import * as entityStatus from 'app/entity_editor/EntityStatus';
import * as ResourceUtils from 'utils/ResourceUtils';

import TheLocaleStore from 'services/localeStore';
import * as accessChecker from 'access_control/AccessChecker';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';
import createViewPersistor from 'data/ListViewPersistor';
import FileSizeLimitWarning from './FileSizeLimitWarning';

export default function register() {
  registerController('AssetListController', [
    '$scope',
    '$controller',
    '$state',
    'spaceContext',
    function AssetListController($scope, $controller, $state, spaceContext) {
      const entityType = 'asset';
      $scope.entityType = entityType;

      const viewPersistor = createViewPersistor({ entityType });

      const searchController = $controller('AssetSearchController', {
        $scope,
        viewPersistor,
      });

      // temporary helper to make react sibling update
      $scope.savedViewsUpdated = 0;
      $scope.onViewSaved = (tab) => {
        $scope.initialTab = tab;
        $scope.savedViewsUpdated += 1;
        $scope.$apply();
      };
      $scope.onSelectSavedView = () => {
        searchController.resetAssets();
      };

      $scope.entityStatus = entityStatus;

      $scope.shouldHide = accessChecker.shouldHide;
      $scope.shouldDisable = accessChecker.shouldDisable;
      $scope.canUploadMultipleAssets = accessChecker.canUploadMultipleAssets;
      $scope.searchController = searchController;
      $scope.paginator = searchController.paginator;

      $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(spaceContext.organization);
      $scope.isMasterEnvironment = spaceContext.isMasterEnvironment();

      const trackEnforcedButtonClick = (err) => {
        // If we get reason(s), that means an enforcement is present
        const reason = _.get(err, 'body.details.reasons', null);

        Analytics.track('entity_button:click', {
          entityType: 'asset',
          enforced: Boolean(reason),
          reason,
        });
      };

      $scope.newAsset = () => {
        Analytics.track('asset_list:add_asset_single');
        entityCreator
          .newAsset()
          .then((asset) => {
            // X.list -> X.detail
            $state.go('^.detail', { assetId: asset.getId() });
          })
          .catch((err) => {
            trackEnforcedButtonClick(err);

            // Throw err so the UI can also display it
            throw err;
          });
      };

      const resetPaginatorProps = () => {
        $scope.paginatorProps = {
          page: $scope.paginator.getPage(),
          pageCount: $scope.paginator.getPageCount(),
          select: (page) => {
            $scope.paginator.setPage(page);
            $scope.$applyAsync();
          },
        };
      };
      resetPaginatorProps();
      $scope.$watch('paginator.getPage()', resetPaginatorProps);
      $scope.$watch('paginator.getTotal()', resetPaginatorProps);

      // These are the props for FileSizeLimitWarning and RecordsResourceUsage
      const space = spaceContext.space.data;
      const environmentId = spaceContext.getEnvironmentId();

      $scope.limitWarningProps = {
        organizationId: spaceContext.organization.sys.id,
        spaceId: space.sys.id,
      };
      $scope.fileSizeLimitComponent = FileSizeLimitWarning;

      // These are the props for RecordsResourceUsage
      const resetUsageProps = debounce(async () => {
        $scope.usageProps = {
          space,
          environmentId,
          isMasterEnvironment: spaceContext.isMasterEnvironment(),
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
            spaceId: spaceContext.getId(),
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
        return !hasAssets && hasQuery && !$scope.context.isLoading;
      };

      // TODO this code is duplicated in the entry list controller
      $scope.showNoAssetsAdvice = () => {
        const hasQuery = searchController.hasQuery();
        const hasAssets = $scope.paginator.getTotal() > 0;

        return !hasAssets && !hasQuery && !$scope.context.isLoading;
      };

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

      $scope.updateAssets = () => searchController.resetAssets();
      $scope.getAssets = () => $scope.assets;
    },
  ]);
}
