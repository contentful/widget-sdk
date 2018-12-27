import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import Paginator from 'classes/Paginator.es6';
import { createSelection } from 'classes/Selection.es6';
import * as entityStatus from 'app/entity_editor/EntityStatus.es6';
import { getBlankEntryView as getBlankView } from 'data/UiConfig/Blanks.es6';
import * as EnvironmentUtils from 'utils/EnvironmentUtils.es6';

/**
 * @ngdoc type
 * @name EntryListController
 */
registerController('EntryListController', [
  '$scope',
  '$state',
  '$controller',
  'spaceContext',
  'EntityListCache',
  'entityCreator',
  'access_control/AccessChecker/index.es6',
  'analytics/Analytics.es6',
  'utils/ResourceUtils.es6',
  'app/ContentList/SavedViewsSidebar.es6',
  function EntryListController(
    $scope,
    $state,
    $controller,
    spaceContext,
    EntityListCache,
    entityCreator,
    accessChecker,
    Analytics,
    ResourceUtils,
    { default: createSavedViewsSidebar }
  ) {
    const searchController = $controller('EntryListSearchController', { $scope: $scope });
    $controller('DisplayedFieldsController', { $scope: $scope });
    $controller('EntryListColumnsController', { $scope: $scope });

    $controller('ListViewsController', {
      $scope: $scope,
      getBlankView: getBlankView,
      preserveStateAs: 'entries',
      resetList: _.noop
    });

    $scope.savedViewsSidebar = createSavedViewsSidebar({
      entityFolders: spaceContext.uiConfig.entries,
      loadView: function(view) {
        $scope.loadView(view);
      },
      getCurrentView: function() {
        return _.cloneDeep(_.get($scope, ['context', 'view'], {}));
      },
      // a view can be assigned to roles only in the Entry List
      roleAssignment: {
        membership: spaceContext.space.data.spaceMembership,
        endpoint: spaceContext.endpoint
      }
    });

    $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(spaceContext.organization);
    $scope.isInsideMasterEnv = EnvironmentUtils.isInsideMasterEnv(spaceContext);

    $scope.entityStatus = entityStatus;

    $scope.paginator = Paginator.create();
    $scope.selection = createSelection();

    $scope.shouldHide = accessChecker.shouldHide;
    $scope.shouldDisable = accessChecker.shouldDisable;

    // Properties passed to RecordsResourceUsage
    const resetUsageProps = _.debounce(() => {
      $scope.usageProps = {
        space: spaceContext.space.data,
        currentTotal: $scope.paginator.getTotal()
      };
    });

    const trackEnforcedButtonClick = err => {
      // If we get reason(s), that means an enforcement is present
      const reason = _.get(err, 'body.details.reasons', null);

      Analytics.track('entity_button:click', {
        entityType: 'entry',
        enforced: Boolean(reason),
        reason
      });
    };

    $scope.$watch('paginator.getTotal()', resetUsageProps);
    resetUsageProps();

    $scope.entryCache = new EntityListCache({
      space: spaceContext.space,
      entityType: 'Entry',
      limit: 5
    });

    $scope.assetCache = new EntityListCache({
      space: spaceContext.space,
      entityType: 'Asset',
      limit: 3
    });

    $scope.newContentType = () => {
      // X.entries.list -> X.content_types.new
      $state.go('^.^.content_types.new');
    };

    $scope.newEntry = contentTypeId => {
      const contentType = spaceContext.publishedCTs.get(contentTypeId);
      entityCreator
        .newEntry(contentTypeId)
        .then(entry => {
          const eventOriginFlag = $scope.showNoEntriesAdvice() ? '--empty' : '';
          Analytics.track('entry:create', {
            eventOrigin: 'content-list' + eventOriginFlag,
            contentType: contentType,
            response: entry
          });

          // X.list -> X.detail
          $state.go('^.detail', { entryId: entry.getId() });
        })
        .catch(err => {
          trackEnforcedButtonClick(err);

          throw err;
        });
    };

    $scope.getSearchContentType = () => spaceContext.publishedCTs.get(getCurrentContentTypeId());

    $scope.$watch(accessChecker.getResponses, updateAccessibleCts);
    $scope.$watch(getCurrentContentTypeId, updateAccessibleCts);

    K.onValueScope($scope, spaceContext.publishedCTs.items$, cts => {
      $scope.hasContentType = cts.length > 0;
      updateAccessibleCts();
    });

    function updateAccessibleCts() {
      $scope.accessibleCts = _.filter(spaceContext.publishedCTs.getAllBare(), ct =>
        accessChecker.canPerformActionOnEntryOfType('create', ct.sys.id)
      );
    }

    $scope.displayFieldForFilteredContentType = () =>
      spaceContext.displayFieldForType(getCurrentContentTypeId());

    function getCurrentContentTypeId() {
      return getViewItem('contentTypeId');
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
     * TODO:xxx Rename!
     *
     * @return {boolean}
     */
    $scope.showNoEntriesAdvice = () => {
      const hasQuery = searchController.hasQuery();
      const hasEntries = $scope.paginator.getTotal() > 0;

      return !hasEntries && !hasQuery && !$scope.context.loading;
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
      const hasCollection = getViewItem('collection');
      return !hasEntries && hasQuery && !hasCollection && !$scope.context.loading;
    };

    /**
     * @ngdoc method
     * @name EntryListController#$scope.isEmptyCollection
     * @description
     * Returns true if a collection view is active but there is nothing
     * in the collection.
     *
     * @return {boolean}
     */
    $scope.isEmptyCollection = () =>
      !$scope.paginator.getTotal() && getViewItem('collection') && !$scope.context.loading;

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
    $scope.$watch('showNoEntriesAdvice()', show => {
      if (show) {
        $scope.hasArchivedEntries = false;
        return hasArchivedEntries(spaceContext.space).then(hasArchived => {
          $scope.hasArchivedEntries = hasArchived;
        });
      }
    });

    // TODO This function is called repeatedly from the template.
    // Unfortunately, 'publishedCTs.get' has the side effect of
    // fetching the CT if it was not found. This results in problems
    // when we switch the space but this directive is still active. We
    // request a content type from the _new_ space which does not
    // exist.
    // The solution is to separate `entryTitle()` and similar
    // functions from the space context.
    $scope.entryTitle = entry => {
      let entryTitle = spaceContext.entryTitle(entry);
      const length = 130;
      if (entryTitle.length > length) {
        entryTitle = truncate(entryTitle, length);
      }
      return entryTitle;
    };

    // TODO this code is duplicated in the asset list controller
    function hasArchivedEntries(space) {
      return space
        .getEntries({
          limit: 1,
          'sys.archivedAt[exists]': true
        })
        .then(response => response && response.total > 0);
    }

    function getViewItem(path) {
      path = _.isString(path) ? path.split('.') : path;
      return _.get($scope, ['context', 'view'].concat(path));
    }
  }
]);
