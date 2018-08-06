'use strict';

angular.module('contentful')
/**
 * @ngdoc type
 * @name EntryListController
 */
.controller('EntryListController', ['$scope', 'require', function EntryListController ($scope, require) {
  const $controller = require('$controller');
  const EntityListCache = require('EntityListCache');
  const Paginator = require('Paginator');
  const createSelection = require('selection');
  const spaceContext = require('spaceContext');
  const accessChecker = require('access_control/AccessChecker');
  const entityStatus = require('entityStatus');
  const getBlankView = require('data/UiConfig/Blanks').getBlankEntryView;
  const createSavedViewsSidebar = require('app/ContentList/SavedViewsSidebar').default;
  const Analytics = require('analytics/Analytics');
  const K = require('utils/kefir');
  const _ = require('lodash');
  const $state = require('$state');
  const entityCreator = require('entityCreator');
  const ResourceUtils = require('utils/ResourceUtils');
  const EnvironmentUtils = require('utils/EnvironmentUtils');
  const debounce = require('lodash').debounce;
  const truncate = require('stringUtils').truncate;

  const searchController = $controller('EntryListSearchController', {$scope: $scope});
  $controller('DisplayedFieldsController', {$scope: $scope});
  $controller('EntryListColumnsController', {$scope: $scope});

  $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    preserveStateAs: 'entries',
    resetList: _.noop
  });

  $scope.savedViewsSidebar = createSavedViewsSidebar({
    entityFolders: spaceContext.uiConfig.entries,
    loadView: function (view) {
      $scope.loadView(view);
    },
    getCurrentView: function () {
      return _.cloneDeep(_.get($scope, ['context', 'view'], {}));
    },
    // a view can be assigned to roles only in the Entry List
    roleAssignment: {
      membership: spaceContext.space.data.spaceMembership,
      endpoint: spaceContext.endpoint
    }
  });

  const organization = spaceContext.organizationContext.organization;

  $scope.isLegacyOrganization = ResourceUtils.isLegacyOrganization(organization);
  $scope.isInsideMasterEnv = EnvironmentUtils.isInsideMasterEnv(spaceContext);

  $scope.entityStatus = entityStatus;

  $scope.paginator = Paginator.create();
  $scope.selection = createSelection();

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

  // Properties passed to RecordsResourceUsage
  const resetUsageProps = debounce(() => {
    $scope.usageProps = {
      space: spaceContext.space.data,
      currentTotal: $scope.paginator.getTotal()
    };
  });

  const trackButtonClick = debounce(() => {
    // Track the new entry button click, with usage
    //
    // This should happen before the entry is created via the CMA, so that
    // if the CMA fails the button click is still tracked properly with usage
    return resources.get('record').then(recordResource => {
      Analytics.track('entity_button:click', {
        entityType: 'entry',
        usage: recordResource.usage,
        limit: ResourceUtils.getResourceLimits(recordResource).maximum
      });
    });
  });

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
    trackButtonClick();

    const contentType = spaceContext.publishedCTs.get(contentTypeId);
    entityCreator.newEntry(contentTypeId).then(entry => {
      const eventOriginFlag = $scope.showNoEntriesAdvice() ? '--empty' : '';
      Analytics.track('entry:create', {
        eventOrigin: 'content-list' + eventOriginFlag,
        contentType: contentType,
        response: entry
      });

      // X.list -> X.detail
      $state.go('^.detail', {entryId: entry.getId()});
    });
  };

  $scope.getSearchContentType = () => spaceContext.publishedCTs.get(getCurrentContentTypeId());

  $scope.$watch(accessChecker.getResponses, updateAccessibleCts);
  $scope.$watch(getCurrentContentTypeId, updateAccessibleCts);

  K.onValueScope($scope, spaceContext.publishedCTs.items$, cts => {
    $scope.hasContentType = cts.length > 0;
    updateAccessibleCts();
  });

  function updateAccessibleCts () {
    $scope.accessibleCts = _.filter(
      spaceContext.publishedCTs.getAllBare(),
      ct => accessChecker.canPerformActionOnEntryOfType('create', ct.sys.id)
    );
  }

  $scope.displayFieldForFilteredContentType = () => spaceContext.displayFieldForType(getCurrentContentTypeId());

  function getCurrentContentTypeId () {
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
  $scope.isEmptyCollection = () => !$scope.paginator.getTotal() &&
    getViewItem('collection') && !$scope.context.loading;

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
      return hasArchivedEntries(spaceContext.space)
        .then(hasArchived => {
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
    var entryTitle = spaceContext.entryTitle(entry);
    var length = 130;
    if (entryTitle.length > length) {
      entryTitle = truncate(entryTitle, length);
    }
    return entryTitle;
  };

  // TODO this code is duplicated in the asset list controller
  function hasArchivedEntries (space) {
    return space.getEntries({
      'limit': 1,
      'sys.archivedAt[exists]': true
    }).then(response => response && response.total > 0);
  }

  function getViewItem (path) {
    path = _.isString(path) ? path.split('.') : path;
    return _.get($scope, ['context', 'view'].concat(path));
  }
}]);
