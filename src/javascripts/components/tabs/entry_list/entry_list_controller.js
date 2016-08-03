'use strict';

angular.module('contentful')
/**
 * @ngdoc type
 * @name EntryListController
 */
.controller('EntryListController', ['$scope', '$injector', function EntryListController ($scope, $injector) {
  var $controller = $injector.get('$controller');
  var EntityListCache = $injector.get('EntityListCache');
  var logger = $injector.get('logger');
  var Paginator = $injector.get('Paginator');
  var createSelection = $injector.get('selection');
  var spaceContext = $injector.get('spaceContext');
  var accessChecker = $injector.get('accessChecker');
  var entityStatus = $injector.get('entityStatus');

  var searchController = $controller('EntryListSearchController', {$scope: $scope});
  $controller('DisplayedFieldsController', {$scope: $scope});
  $controller('EntryListViewsController', {$scope: $scope});
  $scope.entityStatus = entityStatus;

  $scope.paginator = new Paginator();
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

  $scope.getSearchContentType = function () {
    var id = dotty.get($scope, 'context.view.contentTypeId');
    return spaceContext.getPublishedContentType(id);
  };

  $scope.$watchCollection(function () {
    return {
      cts: spaceContext.publishedContentTypes,
      responses: accessChecker.getResponses()
    };
  }, function () {
    // TODO this should be enforced by the space context
    var publishedCTs = _.uniqBy(spaceContext.publishedContentTypes, function (ct) {
      return ct.getId();
    });
    $scope.accessibleCts = _.filter(publishedCTs, function (ct) {
      return accessChecker.canPerformActionOnEntryOfType('create', ct.getId());
    });
  });

  $scope.typeNameOr = function (or) {
    var id;
    try {
      id = dotty.get($scope, 'context.view.contentTypeId');
      if (!id) return or;
      var ct = spaceContext.getPublishedContentType(id);
      if (!ct) return or;
      return 'entries of the content type "' + ct.getName() + '"';
    } catch (e) {
      logger.logException(e, {data: {contentTypeId: id}});
      return or;
    }
  };

  $scope.selectedContentType = function () {
    searchController.resetSearchTerm();
    $scope.resetDisplayFields();
  };

  $scope.displayFieldForFilteredContentType = function () {
    return spaceContext.displayFieldForType($scope.context.view.contentTypeId);
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
    var hasEntries = $scope.entries && $scope.entries.length > 0;
    return !hasEntries && !hasQuery && !$scope.context.loading;
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

  var narrowFieldTypes = [
    'integer',
    'number',
    'boolean'
  ];

  var mediumFieldTypes = [
    'text',
    'symbol',
    'location',
    'date',
    'array',
    'link'
  ];

  $scope.getFieldClass = function (field) {
    var type = field.type.toLowerCase();
    var sizeClass = ' ';
    if (_.includes(narrowFieldTypes, type)) sizeClass += 'narrow';
    else if (_.includes(mediumFieldTypes, type)) sizeClass += 'medium';
    return 'cell-' + type + sizeClass;
  };

  $scope.$on('reloadEntries', function () {
    $scope.updateEntries();
  });
}]);
