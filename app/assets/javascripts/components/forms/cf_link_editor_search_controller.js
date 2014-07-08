'use strict';

angular.module('contentful').controller('cfLinkEditorSearchCtrl', ['$scope', '$attrs', '$injector', function($scope, $attrs, $injector) {
  var $q                = $injector.get('$q');
  var mimetype          = $injector.get('mimetype');
  var Paginator         = $injector.get('Paginator');
  var PromisedLoader    = $injector.get('PromisedLoader');
  var notification      = $injector.get('notification');
  var searchQueryHelper = $injector.get('searchQueryHelper');

  var controller = this;
  var entityLoader = new PromisedLoader();
  $scope.paginator = new Paginator();

  $scope.$watch($attrs.entityType, function (entityType) {
    $scope.entityType = entityType;
  });
  $scope.$watch($attrs.entityContentType, function (entityContentType) {
    $scope.entityContentType = entityContentType;
  });
  $scope.$watch($attrs.entityMimeTypeGroup, function (entityMimeTypeGroup) {
    $scope.entityMimeTypeGroup = entityMimeTypeGroup;
  });
  $scope.$watchCollection('[entityType, entityContentType, entityMimeTypeGroup]', updateEntityName);

  function updateEntityName() {
    if($scope.entityType == 'Entry' && $scope.entityContentType){
      $scope.entityName = $scope.entityContentType.getName();
    } else if ($scope.entityType == 'Asset' && $scope.entityMimeTypeGroup) {
      $scope.entityName = mimetype.groupDisplayNames[$scope.entityMimeTypeGroup];
    } else {
      $scope.entityName = $scope.entityType;
    }
  }

  // STATES
  // CLEAR - Initial state, no search, no results
  this.isClearState = function () {
    return !this._searchResultsVisible;
  };
  // EMPTY - Search, Results, but empty
  this.isEmptyState = function () {
    return this._searchResultsVisible && _.isEmpty($scope.entities);
  };
  // RESULTS - Search and Results
  this.isResultsState = function () {
    return this._searchResultsVisible && !_.isEmpty($scope.entities);
  };

  this.hideSearchResults = function () {
    this._searchResultsVisible = false;
    $scope.$emit('searchResultsHidden');
  };

  this.showSearchResults = function () {
    this._searchResultsVisible = true;
  };

  this.areResultsVisible = function () {
    return this._searchResultsVisible;
  };

  $scope.$on('searchSubmitted', function () {
    controller._resetEntities();
  });

  $scope.$on('autocompleteResultSelected', function (event, index, entity) {
    event.currentScope.selectedEntity = entity;
  });

  $scope.$on('autocompleteResultPicked', function (event, index, entity) {
    addEntity(entity).then(function () {
      // TODO shouldn't be necessary because the link editor hides the search anyway
      if ($scope.linkSingle) controller.clearSearch();
    });
  });

  $scope.$on('autocompleteResultsCancel', function (event) {
    if (!controller._searchResultsVisible) event.preventDefault();
    controller.clearSearch();
  });

  $scope.$on('tokenizedSearchShowAutocompletions', function (ev, showing) {
    if (showing) controller.clearSearch();
  });

  $scope.$on('tokenizedSearchInputChanged', function () {
    controller.clearSearch();
  });

  $scope.pick = function (entity) {
    addEntity(entity).then(function () {
      controller.clearSearch();
    });
  };

  $scope.addNewEntry = function(contentType) {
    var cb = $q.callback(), cbDelete = $q.callback();
    $scope.spaceContext.space.createEntry(contentType.getId(), {}, cb);
    return cb.promise
    .then(function createEntityHandler(entry) {
      return addEntity(entry)
      .then(function addLinkHandler() {
        $scope.navigator.entryEditor(entry).goTo();
      })
      .catch(function addLinkErrorHandler(errSetLink) {
        notification.serverError('Error linking Entry', errSetLink);
        entry['delete'](cbDelete);
        return cbDelete.promise;
      })
      .catch(function deleteEntityErrorHandler(errDelete) {
        notification.serverError('Error deleting Entry again', errDelete);
        return $q.reject(errDelete);
      });
    }, function createEntityErrorHandler(errCreate) {
      notification.serverError('Error creating Entry', errCreate);
      return $q.reject(errCreate);
    });
  };

  $scope.addNewAsset = function() {
    var cb = $q.callback(), cbDelete = $q.callback();
    $scope.spaceContext.space.createAsset({}, cb);
    return cb.promise
    .then(function createEntityHandler(asset) {
      return addEntity(asset)
      .then(function addLinkHandler() {
        $scope.navigator.assetEditor(asset).goTo();
      })
      .catch(function addLinkErrorHandler(errSetLink) {
        notification.serverError('Error linking Asset', errSetLink);
        asset['delete'](cbDelete);
        return cbDelete.promise;
      })
      .catch(function deleteEntityErrorHandler(errDelete) {
        notification.serverError('Error deleting Asset again', errDelete);
        return $q.reject(errDelete);
      });
    }, function createEntityErrorHandler(errCreate) {
      notification.serverError('Error creating Asset', errCreate);
      return $q.reject(errCreate);
    });
  };

  this.clearSearch = function () {
    $scope.paginator.page = 0;
    $scope.entities = [];
    $scope.selectedEntity = null;
    controller.hideSearchResults();
  };

  this._resetEntities = function() {
    this.clearSearch();
    this._loadEntities()
    .then(function (entities) {
      controller.showSearchResults();
      $scope.paginator.numEntries = entities.total;
      $scope.entities = entities;
      $scope.selectedEntity = entities[0];
    });
  };

  this._loadEntities = function () {
    return buildQuery()
    .then(function (query) {
      return entityLoader.loadCallback($scope.spaceContext.space, $scope.fetchMethod, query);
    });
  };

  this.loadMore = function() {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    controller._loadEntities()
    .then(function (entities) {
      $scope.paginator.numEntries = entities.total;
      $scope.entities.push.apply($scope.entities, entities);
    }, function () {
      $scope.paginator.page--;
    });
  };

  $scope.getSearchContentType = function () {
    if ($scope.entityType === 'Asset')
     return searchQueryHelper.assetContentType;
    if ($scope.entityContentType)
      return $scope.entityContentType;
  };

  $scope.$on('$destroy', function () {
    $scope = null; //MEMLEAK FIX
  });

  function addEntity(entity) {
    return $q.when($scope.$eval($attrs.addEntity, {entity: entity}));
  }

  function buildQuery() {
    var contentType;
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.entityType === 'Asset') {
      contentType = searchQueryHelper.assetContentType;
      if ($scope.entityMimeTypeGroup)
        queryObject['mimetype_group'] = $scope.entityMimeTypeGroup;
        //TODO well, actually when the entityMimeTypeGroup is predefined, we shouldn't allow searching for it
    } else if ($scope.entityType === 'Entry') {
      if ($scope.entityContentType)
        contentType = $scope.entityContentType;
    }

    return searchQueryHelper.buildQuery($scope.spaceContext.space, contentType, $scope.searchTerm)
    .then(function (searchQuery) {
      _.extend(searchQuery, queryObject);
      return searchQuery;
    });
  }

}]);
