'use strict';

angular.module('contentful')
/**
 * @ngdoc type
 * @name EntryListController
 */
.controller('EntryListController', ['$scope', 'require', function EntryListController ($scope, require) {
  var $controller = require('$controller');
  var EntityListCache = require('EntityListCache');
  var Paginator = require('Paginator');
  var createSelection = require('selection');
  var spaceContext = require('spaceContext');
  var accessChecker = require('access_control/AccessChecker');
  var entityStatus = require('entityStatus');
  var getBlankView = require('data/UiConfig/Blanks').getBlankEntryView;
  var createSavedViewsSidebar = require('app/ContentList/SavedViewsSidebar').default;
  var Analytics = require('analytics/Analytics');
  var K = require('utils/kefir');
  var _ = require('lodash');
  var $state = require('$state');
  var entityCreator = require('entityCreator');
  var ResourceUtils = require('utils/ResourceUtils');
  var EnvironmentUtils = require('utils/EnvironmentUtils');

  var searchController = $controller('EntryListSearchController', {$scope: $scope});
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

  $scope.usageProps = {
    space: spaceContext.space.data
  };

  $scope.entityStatus = entityStatus;

  $scope.paginator = Paginator.create();
  $scope.selection = createSelection();

  $scope.shouldHide = accessChecker.shouldHide;
  $scope.shouldDisable = accessChecker.shouldDisable;

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
    var contentType = spaceContext.publishedCTs.get(contentTypeId);
    entityCreator.newEntry(contentTypeId).then(entry => {
      var eventOriginFlag = $scope.showNoEntriesAdvice() ? '--empty' : '';
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
    var hasQuery = searchController.hasQuery();
    var hasEntries = $scope.paginator.getTotal() > 0;

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
    var hasQuery = searchController.hasQuery();
    var hasEntries = $scope.paginator.getTotal() > 0;
    var hasCollection = getViewItem('collection');
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
