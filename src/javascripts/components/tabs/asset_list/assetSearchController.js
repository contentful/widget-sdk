import { registerController } from 'core/NgRegistry';
import _ from 'lodash';
import Paginator from 'classes/Paginator';
import ReloadNotification from 'app/common/ReloadNotification';
import { Notification } from '@contentful/forma-36-react-components';
import { assetContentType } from 'libs/legacy_client/client';
import * as SystemFields from 'data/SystemFields';
import * as logger from 'services/logger';
import * as ListQuery from 'search/listQuery';
import { PromisedLoader } from './services/PromisedLoader';
import * as Tracking from 'analytics/events/SearchAndViews';

export default function register() {
  registerController('AssetSearchController', [
    '$scope',
    '$q',
    'spaceContext',
    'viewPersistor',
    function AssetSearchController($scope, $q, spaceContext, viewPersistor) {
      const controller = this;
      const assetLoader = new PromisedLoader();

      const setIsSearching = makeIsSearchingSetter(true);
      const unsetIsSearching = makeIsSearchingSetter(false);

      $scope.context.ready = false;
      $scope.context.isLoading = true;

      this.hasQuery = hasQuery;

      this.paginator = Paginator.create();
      $scope.assetContentType = assetContentType;

      // TODO: Get rid of duplicate code in entry_list_search_controller.js

      $scope.isLoading = $scope.context.isSearching;
      $scope.onUpdate = () => {
        controller.resetAssets(true);
        $scope.forcedRender++;
      };
      $scope.getContentTypes = () => spaceContext.publishedCTs.getAllBare();
      $scope.forcedRender = 0;
      $scope.$watch(() => viewPersistor.readKey('id'), $scope.onUpdate);

      this.resetAssets = function (resetPage) {
        const currPage = this.paginator.getPage();

        if (resetPage) {
          this.paginator.setPage(0);
        }
        if (!resetPage && !_.get($scope.assets, 'length', 0) && currPage > 0) {
          this.paginator.setPage(currPage - 1);
        }

        return prepareQuery()
          .then(setIsSearching)
          .then((query) => spaceContext.space.getAssets(query))
          .then(
            (assets) => {
              $scope.context.ready = true;
              controller.paginator.setTotal(assets.total);
              Tracking.searchPerformed(viewPersistor.read(), assets.total);
              $scope.assets = filterOutDeleted(assets);
              return assets;
            },
            (err) => {
              handleAssetsError(err);
              return $q.reject(err);
            }
          )
          .then(unsetIsSearching)
          .catch(ReloadNotification.apiErrorHandler);
      };

      $scope.onUpdate();

      function handleAssetsError(err) {
        const isInvalidQuery = isInvalidQueryError(err);
        $scope.context.isLoading = false;
        $scope.context.ready = true;

        // Reset the view only if the UI was not edited yet.
        if (isInvalidQuery) {
          // invalid search query, let's reset the view...
          viewPersistor.save({});
          // ...and let it request assets again after notifing a user
          Notification.error('We detected an invalid search query. Please try again.');
        }
      }

      function isInvalidQueryError(err) {
        return _.isObject(err) && 'statusCode' in err && [400, 422].indexOf(err.statusCode) > -1;
      }

      this.loadMore = function () {
        if (this.paginator.isAtLast()) {
          return $q.resolve();
        }

        this.paginator.next();
        let queryForDebug;

        return prepareQuery()
          .then((query) => {
            queryForDebug = query;
            return assetLoader.loadPromise(() => spaceContext.space.getAssets(query));
          })
          .then(
            (assets) => {
              if (!assets) {
                logger.logError('Failed to load more assets', {
                  data: {
                    assets: assets,
                    query: queryForDebug,
                  },
                });
                return;
              }
              controller.paginator.setTotal(assets.total);
              assets = _.difference(assets, $scope.assets);
              $scope.assets.push(...filterOutDeleted(assets));
            },
            (err) => {
              controller.paginator.prev();
              return $q.reject(err);
            }
          )
          .catch(ReloadNotification.apiErrorHandler);
      };

      function makeIsSearchingSetter(flag) {
        return (val) => {
          $scope.context.isLoading = flag;
          return val;
        };
      }

      function filterOutDeleted(assets) {
        return _.filter(assets, (asset) => !asset.isDeleted());
      }

      function prepareQuery() {
        return ListQuery.getForAssets(getQueryOptions());
      }

      function getQueryOptions() {
        return _.extend(getViewSearchState(), {
          order: SystemFields.getDefaultOrder(),
          paginator: controller.paginator,
        });
      }

      function hasQuery() {
        const search = getViewSearchState();
        return !_.isEmpty(search.searchText) || !_.isEmpty(search.searchFilters);
      }

      function getViewSearchState() {
        return viewPersistor.readKeys(['searchText', 'searchFilters']);
      }
    },
  ]);
}
