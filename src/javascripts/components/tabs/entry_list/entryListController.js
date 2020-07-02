import { registerController } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'core/utils/kefir';
import Paginator from 'classes/Paginator';
import * as entityStatus from 'app/entity_editor/EntityStatus';
import * as ResourceUtils from 'utils/ResourceUtils';
import EntityListCache from 'classes/entityListCache';
import * as Analytics from 'analytics/Analytics';
import * as accessChecker from 'access_control/AccessChecker';
import * as entityCreator from 'components/app_container/entityCreator';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import createViewPersistor from 'data/ListViewPersistor';

export default function register() {
  /**
   * @ngdoc type
   * @name EntryListController
   */
  registerController('EntryListController', [
    '$scope',
    '$state',
    '$controller',
    'spaceContext',
    function EntryListController($scope, $state, $controller, spaceContext) {
      const entityType = 'entry';
      $scope.entityType = entityType;
      $scope.paginator = Paginator.create();

      // temporary helper to make react sibling update
      $scope.savedViewsUpdated = 0;
      $scope.onViewSaved = (tab) => {
        $scope.initialTab = tab;
        $scope.savedViewsUpdated += 1;
        $scope.$apply();
      };
      $scope.onSelectSavedView = (view) => {
        $scope.initialState = view;
        $scope.$apply();
        $scope.updateEntries();
      };

      const viewPersistor = createViewPersistor({ entityType });
      const searchController = $controller('EntryListSearchController', {
        $scope: $scope,
        viewPersistor,
      });

      $scope.entryCache = new EntityListCache({
        space: spaceContext.space,
        entityType: 'Entry',
        limit: 5,
      });

      $scope.assetCache = new EntityListCache({
        space: spaceContext.space,
        entityType: 'Asset',
        limit: 3,
      });

      $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(spaceContext.organization);
      $scope.environmentId = spaceContext.getEnvironmentId();
      $scope.isMasterEnvironment = spaceContext.isMasterEnvironment();

      $scope.entityStatus = entityStatus;

      $scope.shouldHide = accessChecker.shouldHide;
      $scope.shouldDisable = accessChecker.shouldDisable;

      // Properties passed to RecordsResourceUsage
      const resetUsageProps = _.debounce(() => {
        $scope.usageProps = {
          space: spaceContext.space.data,
          environmentId: spaceContext.getEnvironmentId(),
          isMasterEnvironment: spaceContext.isMasterEnvironment(),
          currentTotal: $scope.paginator.getTotal(),
        };
        $scope.$applyAsync();
      });

      const resetSearchResults = _.debounce(() => {
        $scope.entryProps = {
          isSearching: $scope.context.isLoading,
          displayFieldForFilteredContentType: $scope.displayFieldForFilteredContentType,
          entries: $scope.entries,
          updateEntries: () => $scope.updateEntries(),
          entryCache: $scope.entryCache,
          assetCache: $scope.assetCache,
          jobs: $scope.jobs,
          pageIndex: $scope.paginator.getPage(),
        };
        $scope.suggestedContentTypeId = getCurrentContentTypeId();
        $scope.paginatorProps = {
          page: $scope.paginator.getPage(),
          pageCount: $scope.paginator.getPageCount(),
          select: (page) => {
            $scope.paginator.setPage(page);
            $scope.$applyAsync();
          },
        };

        $scope.$applyAsync();
      });

      const trackEnforcedButtonClick = (err) => {
        // If we get reason(s), that means an enforcement is present
        const reason = _.get(err, 'body.details.reasons', null);

        Analytics.track('entity_button:click', {
          entityType: 'entry',
          enforced: Boolean(reason),
          reason,
        });
      };

      $scope.$watch('paginator.getPage()', resetSearchResults);

      $scope.$watchGroup(
        [
          'context.isLoading',
          'paginator.getPage()',
          'paginator.getTotal()',
          'entryCache.inProgress',
          'assetCache.inProgress',
        ],
        () => {
          resetSearchResults();
        }
      );
      $scope.$watchCollection('entries', () => {
        resetSearchResults();
      });

      resetSearchResults();

      $scope.$watch('paginator.getTotal()', resetUsageProps);
      resetUsageProps();

      $scope.newContentType = () => {
        // X.entries.list -> X.content_types.new
        $state.go('^.^.content_types.new');
      };

      $scope.newEntry = (contentTypeId) => {
        entityCreator
          .newEntry(contentTypeId)
          .then((entry) => {
            const contentType = spaceContext.publishedCTs.get(contentTypeId).data;
            const eventOriginFlag = $scope.showNoEntriesAdvice() ? '--empty' : '';

            Analytics.track('entry:create', {
              eventOrigin: 'content-list' + eventOriginFlag,
              contentType: contentType,
              response: entry.data,
            });

            // X.list -> X.detail
            $state.go('^.detail', { entryId: entry.getId() });
          })
          .catch((err) => {
            trackEnforcedButtonClick(err);

            throw err;
          });
      };

      $scope.getSearchContentType = () => spaceContext.publishedCTs.get(getCurrentContentTypeId());

      $scope.$watch(accessChecker.getResponses, updateAccessibleCts);
      $scope.$watch(getCurrentContentTypeId, updateAccessibleCts);

      K.onValueScope($scope, spaceContext.publishedCTs.items$, (cts) => {
        $scope.hasContentType = cts.length > 0;
        $scope.canEditCT = !accessChecker.shouldDisable(accessChecker.Action.CREATE, 'contentType');
        updateAccessibleCts();
      });

      function updateAccessibleCts() {
        $scope.accessibleCts = _.filter(spaceContext.publishedCTs.getAllBare(), (ct) =>
          accessChecker.canPerformActionOnEntryOfType('create', ct.sys.id)
        );
      }

      $scope.displayFieldForFilteredContentType = () =>
        EntityFieldValueSpaceContext.displayFieldForType(getCurrentContentTypeId());

      function getCurrentContentTypeId() {
        return viewPersistor.readKey('contentTypeId');
      }

      $scope.hasPage = () => !!($scope.entries && $scope.entries.length && !$scope.isEmpty);

      /**
       * @ngdoc method
       * @name EntryListController#$scope.showNoEntriesAdvice
       * @description
       * Returns true if there are no items to be rendered, the user
       * specified no query, and the items are not loading.
       *
       * TODO this code is duplicated in the asset list controller
       *
       * @return {boolean}
       */
      $scope.showNoEntriesAdvice = () => {
        const hasQuery = searchController.hasQuery();
        const hasEntries = $scope.paginator.getTotal() > 0;

        return !hasEntries && !hasQuery && !$scope.context.isLoading;
      };

      /**
       * @ngdoc method
       * @name EntryListController#$scope.hasNoSearchResult
       * @description
       * Returns true if the user has provided a query but no results have
       * been returned from the API.
       *
       * @return {boolean}
       */
      $scope.hasNoSearchResults = () => {
        const hasQuery = searchController.hasQuery();
        const hasEntries = $scope.paginator.getTotal() > 0;
        return !hasEntries && hasQuery && !$scope.context.isLoading;
      };

      /**
       * @ngdoc property
       * @name EntryListController#$scope.hasArchivedEntries
       * @description
       * Value is true if we get archived entries from the API. The value
       * is updated whenever `showNoEntriesAdvice()` changes to `true`.
       *
       * TODO this code is duplicated in the asset list controller
       *
       * @type {boolean}
       */
      $scope.$watch('showNoEntriesAdvice()', (show) => {
        if (show) {
          $scope.hasArchivedEntries = false;
          return hasArchivedEntries(spaceContext.space).then((hasArchived) => {
            $scope.hasArchivedEntries = hasArchived;
          });
        }
      });

      // TODO this code is duplicated in the asset list controller
      function hasArchivedEntries(space) {
        return space
          .getEntries({
            limit: 0,
            'sys.archivedAt[exists]': true,
          })
          .then((response) => response && response.total > 0);
      }
    },
  ]);
}
