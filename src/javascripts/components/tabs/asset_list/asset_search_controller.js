'use strict';

angular
  .module('contentful')

  .controller('AssetSearchController', [
    '$scope',
    'require',
    function($scope, require) {
      const _ = require('lodash');
      const controller = this;
      const $q = require('$q');
      const Paginator = require('classes/Paginator.es6').default;
      const PromisedLoader = require('PromisedLoader');
      const ReloadNotification = require('ReloadNotification');
      const logger = require('logger');
      const spaceContext = require('spaceContext');
      const ListQuery = require('ListQuery');
      const systemFields = require('systemFields');
      const Tracking = require('analytics/events/SearchAndViews.es6');
      const { Notification } = require('@contentful/forma-36-react-components');
      const K = require('utils/kefir.es6');
      const Kefir = require('kefir');
      const createSearchInput = require('app/ContentList/Search').default;
      const React = require('react');

      const assetLoader = new PromisedLoader();

      const setIsSearching = makeIsSearchingSetter(true);
      const unsetIsSearching = makeIsSearchingSetter(false);

      let lastUISearchState = null;

      $scope.context.ready = false;
      $scope.context.loading = true;

      // HACK: This makes sure that component bridge renders
      // somethings until search UI is initialized.
      $scope.search = React.createElement('div');

      this.hasQuery = hasQuery;

      this.paginator = Paginator.create();
      $scope.assetContentType = require('legacy-client').assetContentType;

      // TODO: Get rid of duplicate code in entry_list_search_controller.js

      $scope.$watch(
        () => ({
          viewId: getViewItem('id'),
          search: getViewSearchState()
        }),
        () => {
          if (!isViewLoaded()) {
            return;
          }
          resetAssets();
        },
        true
      );

      function resetAssets() {
        initializeSearchUI();
        return controller.resetAssets(true);
      }

      this.resetAssets = function(resetPage) {
        const currPage = this.paginator.getPage();

        if (resetPage) {
          this.paginator.setPage(0);
        }
        if (!resetPage && !_.get($scope.assets, 'length', 0) && currPage > 0) {
          this.paginator.setPage(currPage - 1);
        }

        return prepareQuery()
          .then(setIsSearching)
          .then(query => spaceContext.space.getAssets(query))
          .then(
            assets => {
              $scope.context.ready = true;
              controller.paginator.setTotal(assets.total);
              Tracking.searchPerformed($scope.context.view, assets.total);
              $scope.assets = filterOutDeleted(assets);
              $scope.selection.updateList($scope.assets);
              return assets;
            },
            err => {
              handleAssetsError(err);
              return $q.reject(err);
            }
          )
          .then(unsetIsSearching)
          .catch(ReloadNotification.apiErrorHandler);
      };

      function handleAssetsError(err) {
        const isInvalidQuery = isInvalidQueryError(err);
        $scope.context.loading = false;
        $scope.context.isSearching = false;
        $scope.context.ready = true;

        // Reset the view only if the UI was not edited yet.
        if (isInvalidQuery) {
          if (lastUISearchState === null) {
            // invalid search query, let's reset the view...
            $scope.loadView({});
          }
          // ...and let it request assets again after notifing a user
          Notification.error('We detected an invalid search query. Please try again.');
        }
      }

      function isInvalidQueryError(err) {
        return _.isObject(err) && 'statusCode' in err && [400, 422].indexOf(err.statusCode) > -1;
      }

      this.loadMore = function() {
        if (this.paginator.isAtLast()) {
          return $q.resolve();
        }

        this.paginator.next();
        let queryForDebug;

        return prepareQuery()
          .then(query => {
            queryForDebug = query;
            return assetLoader.loadPromise(() => spaceContext.space.getAssets(query));
          })
          .then(
            assets => {
              if (!assets) {
                logger.logError('Failed to load more assets', {
                  data: {
                    assets: assets,
                    query: queryForDebug
                  }
                });
                return;
              }
              controller.paginator.setTotal(assets.total);
              assets = _.difference(assets, $scope.assets);
              $scope.assets.push(...filterOutDeleted(assets));
              $scope.selection.updateList($scope.assets);
            },
            err => {
              controller.paginator.prev();
              return $q.reject(err);
            }
          )
          .catch(ReloadNotification.apiErrorHandler);
      };

      function makeIsSearchingSetter(flag) {
        return val => {
          $scope.context.isSearching = flag;
          return val;
        };
      }

      function filterOutDeleted(assets) {
        return _.filter(assets, asset => !asset.isDeleted());
      }

      function onSearchChange(newSearchState) {
        const nextState = _.cloneDeep(newSearchState);
        delete nextState.contentTypeId; // Assets don't have a content type.
        lastUISearchState = nextState;

        const oldView = _.cloneDeep($scope.context.view);
        const newView = _.extend(oldView, nextState);
        $scope.loadView(newView);
      }

      const isSearching$ = K.fromScopeValue($scope, $scope => $scope.context.isSearching);

      function initializeSearchUI() {
        const initialSearchState = getViewSearchState();
        const withAssets = true;

        if (_.isEqual(lastUISearchState, initialSearchState)) {
          return;
        }
        lastUISearchState = initialSearchState;
        createSearchInput({
          $scope: $scope,
          contentTypes: spaceContext.publishedCTs.getAllBare(),
          onSearchChange: onSearchChange,
          isSearching$: isSearching$,
          initState: initialSearchState,
          users$: Kefir.fromPromise(spaceContext.users.getAll()),
          withAssets: withAssets
        });
      }

      function prepareQuery() {
        return ListQuery.getForAssets(getQueryOptions());
      }

      function getQueryOptions() {
        return _.extend(getViewSearchState(), {
          order: systemFields.getDefaultOrder(),
          paginator: controller.paginator
        });
      }

      function isViewLoaded() {
        return !!_.get($scope, ['context', 'view']);
      }

      function hasQuery() {
        const search = getViewSearchState();
        return !_.isEmpty(search.searchText) || !_.isEmpty(search.searchFilters);
      }

      function getViewSearchState() {
        return {
          searchText: getViewItem('searchText'),
          searchFilters: getViewItem('searchFilters')
        };
      }

      function getViewItem(path) {
        path = _.isString(path) ? path.split('.') : path;
        return _.get($scope, ['context', 'view'].concat(path));
      }
    }
  ]);
