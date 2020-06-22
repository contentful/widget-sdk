import { registerController } from 'core/NgRegistry';
import _ from 'lodash';
import debounce from 'lodash/debounce';
import delay from 'lodash/delay';
import { Notification } from '@contentful/forma-36-react-components';
import * as entityStatus from 'app/entity_editor/EntityStatus';
import * as ResourceUtils from 'utils/ResourceUtils';

import * as TokenStore from 'services/TokenStore';
import TheLocaleStore from 'services/localeStore';
import createResourceService from 'services/ResourceService';
import { getResourceLimits } from 'utils/ResourceUtils';
import * as accessChecker from 'access_control/AccessChecker';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';
import createViewPersistor from 'data/ListViewPersistor';
import { isOwner } from 'services/OrganizationRoles';
import {
  showDialog as showChangeSpaceModal,
  getNotificationMessage,
} from 'services/ChangeSpaceService';

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

      // These are the props for AssetLimitWarning and RecordsResourceUsage
      const spaceData = spaceContext.space.data;
      const environmentId = spaceContext.getEnvironmentId();

      $scope.isOrgOwner = isOwner(spaceContext.organization);
      $scope.onUpgradeSpace = async () => {
        const organizationId = spaceContext.organization.sys.id;
        const space = await TokenStore.getSpace(spaceData.sys.id);

        showChangeSpaceModal({
          organizationId,
          scope: 'space',
          space,
          action: 'change',
          onSubmit: async (newProductRatePlan) => {
            Notification.success(
              getNotificationMessage(space, this.state.plan, newProductRatePlan)
            );
            this.setState({ plan: newProductRatePlan });
          },
        });
      };

      const resetUsageProps = debounce(async () => {
        const resourceService = createResourceService(spaceData.sys.id);
        const recordResource = await resourceService.get('record', environmentId);

        const recordsUsage = recordResource.usage;
        const recordsLimit = getResourceLimits(recordResource).maximum;

        $scope.recordsUsage = recordsUsage;
        $scope.recordsLimit = recordsLimit;
        $scope.reachingRecordsLimit = recordsUsage / recordsLimit <= 0.8; // TODO: befoe pushing this condition needs to be inverted
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
