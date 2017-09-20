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
  var accessChecker = require('accessChecker');
  var entityStatus = require('entityStatus');
  var getBlankView = require('data/UiConfig/Blanks').getBlankEntryView;
  var initSavedViewsComponent = require('app/ContentList/SavedViewsComponent').default;

  var searchController = $controller('EntryListSearchController', {$scope: $scope});
  $controller('DisplayedFieldsController', {$scope: $scope});
  $controller('EntryListColumnsController', {$scope: $scope});

  $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    preserveStateAs: 'entries',
    resetList: _.noop
  });

  initSavedViewsComponent({
    $scope: $scope,
    spaceContext: spaceContext,
    scopedUiConfig: spaceContext.uiConfig.forEntries(),
    // a view can be assigned to roles only in the Entry List
    enableRoleAssignment: true
  });

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

  $scope.hasContentType = spaceContext.publishedContentTypes.length > 0;

  $scope.getSearchContentType = function () {
    return spaceContext.publishedCTs.get(_.get($scope, 'context.view.contentTypeId'));
  };

  $scope.$watchCollection(function () {
    return {
      cts: spaceContext.publishedContentTypes,
      responses: accessChecker.getResponses()
    };
  }, function () {
    $scope.accessibleCts = _.filter(spaceContext.publishedContentTypes, function (ct) {
      return accessChecker.canPerformActionOnEntryOfType('create', ct.getId());
    });
  });

  $scope.selectedContentType = function () {
    searchController.resetSearchTerm();
    $scope.resetDisplayFields();
  };

  $scope.displayFieldForFilteredContentType = function () {
    return spaceContext.displayFieldForType($scope.context.view.contentTypeId);
  };

  $scope.hasPage = function () {
    return !!($scope.entries && $scope.entries.length && !$scope.isEmpty);
  };

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
  $scope.showNoEntriesAdvice = function () {
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
  $scope.hasNoSearchResults = function () {
    var hasQuery = searchController.hasQuery();
    var hasEntries = $scope.paginator.getTotal() > 0;
    var hasCollection = $scope.context.view.collection;
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
  $scope.isEmptyCollection = function () {
    return !$scope.paginator.getTotal() && $scope.context.view.collection && !$scope.context.loading;
  };


  /**
   * @ngdoc method
   * @name EntryListController#$scope.displaySearch
   * @description
   * Returns a string that describes the current search.
   *
   * This is displayed to the user when the search was unsuccessful
   *
   * @return {string}
   */
  $scope.displaySearch = function () {
    var view = $scope.context.view;
    if (view.contentTypeId) {
      return 'Content type "' + view.contentTypeId + '", term: ' + view.searchTerm;
    } else {
      return view.searchTerm;
    }
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
  $scope.$watch('showNoEntriesAdvice()', function (show) {
    if (show) {
      $scope.hasArchivedEntries = false;
      return hasArchivedEntries(spaceContext.space)
        .then(function (hasArchived) {
          $scope.hasArchivedEntries = hasArchived;
        });
    }
  });

  // TODO this code is duplicated in the asset list controller
  function hasArchivedEntries (space) {
    return space.getEntries({
      'limit': 1,
      'sys.archivedAt[exists]': true
    }).then(function (response) {
      return response && response.total > 0;
    });
  }
}]);
