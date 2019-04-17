import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import * as Kefir from 'kefir';
import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification.es6';

export default function register() {
  registerController('EntryListSearchController', [
    '$scope',
    '$q',
    'spaceContext',
    'overridingRequestQueue',
    'ListQuery',
    'access_control/AccessChecker/index.es6',
    'analytics/events/SearchAndViews.es6',
    'app/ContentList/Search/index.es6',
    'data/ContentTypeRepo/accessibleCTs.es6',
    function(
      $scope,
      $q,
      spaceContext,
      createRequestQueue,
      ListQuery,
      accessChecker,
      Tracking,
      { default: createSearchInput },
      { default: getAccessibleCTs }
    ) {
      let initialized = false;
      let lastUISearchState = null;

      $scope.context.ready = false;
      $scope.context.loading = true;

      // HACK: This makes sure that component bridge renders
      // somethings until search UI is initialized.
      $scope.search = React.createElement('div');

      // TODO rename this everywhere
      $scope.updateEntries = () => {
        if (isViewLoaded()) {
          resetEntries();
        }
      };

      const updateEntries = createRequestQueue(requestEntries, setupEntriesHandler);

      this.hasQuery = hasQuery;

      // We store the page in a local variable.
      // We need this to determine if a change to 'paginator.getPage()'
      // comes from us or the user.
      let page = 0;
      $scope.$watch(
        () => $scope.paginator.getPage(),
        newPage => {
          if (page !== newPage && initialized) {
            page = newPage;
            updateEntries();
          }
        }
      );

      // TODO: Get rid of duplicate code in asset_search_controller.js

      $scope.$watch(
        () => ({
          viewId: getViewItem('id'),
          search: getViewSearchState()
        }),
        () => {
          if (!isViewLoaded()) {
            return;
          }
          resetEntries();
        },
        true
      );

      $scope.$watch(
        () => ({
          contentTypeId: getViewItem('contentTypeId'),
          displayedFieldIds: getViewItem('displayedFieldIds'),
          entriesLength: $scope.entries && $scope.entries.length,
          page: $scope.paginator.getPage(),
          orderDirection: getViewItem('order.direction'),
          orderFieldId: getViewItem('order.fieldId')
        }),
        refreshEntityCaches,
        true
      );

      // "forceSearch" event is emitted by the tokenized search directive when:
      // - Enter is pressed and not selecting an autocompletion item
      // - "magnifying glass" icon next to input is clicked
      $scope.$on('forceSearch', () => {
        if (!$scope.context.loading) {
          resetEntries();
        }
      });

      // When the user deletes an entry it is removed from the entries
      // list. If that list becomes empty we want to go to the previous
      // page.
      $scope.$watch('entries.length', entriesLength => {
        const currPage = $scope.paginator.getPage();
        if (!entriesLength && !$scope.context.loading && $scope.paginator.getPage() > 0) {
          $scope.paginator.setPage(currPage - 1);
        }
      });

      function resetEntries() {
        $scope.paginator.setPage(0);
        page = 0;
        initializeSearchUI();
        return updateEntries();
      }

      /**
       * This function tries to recover from a response that is to big for the API to handle.
       * It tries to recover by splitting the request into multiple chunks and merging the response.
       * A better but harder solution would be to limit the fields that are requested (no RT / MD / JSON)
       * and don't support these as columns in the entry table.
       *
       * @param {int|null} chunkSize Break request down into multiple chunks (used when response is too big for backend)
       * @return {Promise<[]>}
       */
      function requestEntries(chunkSize = null) {
        initialized = true;
        $scope.context.loading = true;
        $scope.context.isSearching = true;

        let query;
        return prepareQuery()
          .then(
            _query => {
              query = _query;
              let result;
              if (chunkSize === null || query.limit === undefined) {
                return spaceContext.space.getEntries(query);
              } else {
                const skipsForChunks = _.range(query.skip, query.skip + query.limit, chunkSize);
                return Promise.all(
                  skipsForChunks.map(skip =>
                    spaceContext.space.getEntries({ ...query, skip, limit: chunkSize })
                  )
                ).then(results => {
                  result = [].concat(...results);
                  result.total = results[0].total;
                  return result;
                });
              }
            },
            err => {
              handleEntriesError(err);
              return $q.reject(err);
            }
          )
          .then(
            result => {
              $scope.context.isSearching = false;
              Tracking.searchPerformed($scope.context.view, result.total);
              return result;
            },
            err => {
              // check if we can and should try request again in multiple chunks
              // to recover from the response being too big for the API to handle
              if (
                err.status === 400 &&
                _.get(err, 'body.message', '').startsWith('Response size too big') &&
                _.get(query, 'limit') !== undefined &&
                // reaching chunk size 1 is where recursion ends for sure in very few steps,
                // as chunk size is halved with every level of recursion
                (chunkSize === null || chunkSize > 1)
              ) {
                const oldChunkSize = chunkSize === null ? query.limit : chunkSize;
                return requestEntries(Math.floor(oldChunkSize / 2));
              }
              handleEntriesError(err);
              return $q.reject(err);
            }
          );
      }

      function onSearchChange(newSearchState) {
        lastUISearchState = newSearchState;
        const oldView = _.cloneDeep($scope.context.view);
        const newView = _.extend(oldView, newSearchState);
        $scope.loadView(newView);
      }

      const isSearching$ = K.fromScopeValue($scope, $scope => $scope.context.isSearching);

      function initializeSearchUI() {
        const initialSearchState = getViewSearchState();
        const contentTypes = getAccessibleCTs(
          spaceContext.publishedCTs,
          initialSearchState.contentTypeId
        );

        if (_.isEqual(lastUISearchState, initialSearchState)) {
          return;
        }

        lastUISearchState = initialSearchState;
        createSearchInput({
          $scope: $scope,
          contentTypes: contentTypes,
          onSearchChange: onSearchChange,
          isSearching$: isSearching$,
          initState: initialSearchState,
          users$: Kefir.fromPromise(spaceContext.users.getAll())
        });
      }

      function setupEntriesHandler(promise) {
        return promise
          .then(handleEntriesResponse, accessChecker.wasForbidden($scope.context))
          .catch(err => {
            if (_.isObject(err) && 'statusCode' in err && err.statusCode === -1) {
              // entries update failed due to some network issue
              $scope.context.isSearching = true;
            }
            return $q.reject(err);
          })
          .catch(ReloadNotification.apiErrorHandler);
      }

      function handleEntriesResponse(entries) {
        $scope.entries = [];

        if (!entries) {
          $scope.paginator.setTotal(0);
        } else if (Array.isArray(entries)) {
          $scope.paginator.setTotal(entries.total);

          if ($scope.paginator.isBeyondLast()) {
            const lastPage = $scope.paginator.getPageCount() - 1;
            $scope.setPage(lastPage);
          }

          $scope.entries = entries.filter(entry => !entry.isDeleted());
        }
        refreshEntityCaches();
        $scope.selection.updateList($scope.entries);
        $scope.context.ready = true;
        $scope.context.loading = false;
      }

      function handleEntriesError(err) {
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

          if (isUnkownContentTypeError(err)) {
            Notification.error(
              `Provided Content Type "${getViewItem(
                'contentTypeId'
              )}" does not exist. The content type filter has been reset to "Any"`
            );
            setViewItem('contentTypeId', undefined);
            requestEntries();
          } else {
            Notification.error('We detected an invalid search query. Please try again.');
          }
        }
      }

      function isUnkownContentTypeError(err) {
        const errors = _.get(err, ['body', 'details', 'errors']);

        return _.some(errors, ({ name, value }) => {
          return name === 'unknownContentType' && value === 'DOESNOTEXIST';
        });
      }

      function isInvalidQueryError(err) {
        return _.isObject(err) && 'statusCode' in err && [400, 422].indexOf(err.statusCode) > -1;
      }

      function prepareQuery() {
        return ListQuery.getForEntries(getQueryOptions());
      }

      function refreshEntityCaches() {
        if (getViewItem('contentTypeId')) {
          const fieldIds = getViewItem('displayedFieldIds');
          $scope.entryCache.setDisplayedFieldIds(fieldIds);
          $scope.entryCache.resolveLinkedEntities($scope.entries);
          $scope.assetCache.setDisplayedFieldIds(fieldIds);
          $scope.assetCache.resolveLinkedEntities($scope.entries);
        }
      }

      function isViewLoaded() {
        return !!_.get($scope, ['context', 'view']);
      }

      function getQueryOptions() {
        return _.extend(getViewSearchState(), {
          order: getViewItem('order'),
          paginator: $scope.paginator
        });
      }

      function hasQuery() {
        const search = getViewSearchState();
        return (
          !_.isEmpty(search.searchText) ||
          !_.isEmpty(search.searchFilters) ||
          !_.isEmpty(search.contentTypeId)
        );
      }

      function getViewSearchState() {
        return {
          searchText: getViewItem('searchText'),
          searchFilters: getViewItem('searchFilters'),
          contentTypeId: getViewItem('contentTypeId')
        };
      }

      function getViewItem(path) {
        path = _.isString(path) ? path.split('.') : path;
        return _.get($scope, ['context', 'view'].concat(path));
      }

      function setViewItem(path, value) {
        path = _.isString(path) ? path.split('.') : path;
        return _.set($scope, ['context', 'view'].concat(path), value);
      }
    }
  ]);
}
