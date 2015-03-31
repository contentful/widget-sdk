'use strict';

angular.module('contentful').controller('cfLinkEditorSearchController', ['$scope', '$attrs', '$injector', function($scope, $attrs, $injector) {
  var $q                = $injector.get('$q');
  var logger            = $injector.get('logger');
  var mimetype          = $injector.get('mimetype');
  var Paginator         = $injector.get('Paginator');
  var PromisedLoader    = $injector.get('PromisedLoader');
  var notification      = $injector.get('notification');
  var searchQueryHelper = $injector.get('searchQueryHelper');

  var controller = this;
  var entityLoader = new PromisedLoader();
  var fetchMethod;
  $scope.paginator = new Paginator();

  $scope.entityType = $attrs.entityType;
  if ($scope.entityType === 'Entry'){
    fetchMethod = 'getEntries';
  } else if ($scope.entityType === 'Asset') {
    fetchMethod = 'getAssets';
  }
  $scope.$watch($attrs.entityContentTypes, function (entityContentTypes) {
    $scope.entityContentTypes = entityContentTypes;
  });
  $scope.$watch($attrs.entityMimeTypeGroup, function (entityMimeTypeGroup) {
    $scope.entityMimeTypeGroup = entityMimeTypeGroup;
  });
  $scope.$watchCollection('[entityType, entityContentTypes, entityMimeTypeGroup]', updateEntityName);
  $scope.$watch('entityContentTypes', function (contentTypes) {
    if (_.isEmpty(contentTypes)) {
      $scope.addableContentTypes = $scope.spaceContext.publishedContentTypes;
    } else {
      $scope.addableContentTypes = contentTypes;
    }
  });

  function updateEntityName() {
    if($scope.entityType == 'Entry' && singleContentType($scope.entityContentTypes)){
      $scope.entityName = singleContentType($scope.entityContentTypes).getName();
    } else if ($scope.entityType == 'Asset' && $scope.entityMimeTypeGroup) {
      $scope.entityName = mimetype.getGroupNames()[$scope.entityMimeTypeGroup];
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
      if (!$scope.$eval($attrs.ngShow)) controller.clearSearch();
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
    return $scope.spaceContext.space.createEntry(contentType.getId(), {})
    .then(function createEntityHandler(entry) {
      return addEntity(entry)
      .then(function addLinkHandler() {
        $scope.navigator.entryEditor(entry).goTo();
      })
      .catch(function addLinkErrorHandler(errSetLink) {
        notification.error('Error linking Entry');
        logger.logServerWarn('Error linking Entry', {error: errSetLink});
        return entry.delete();
      })
      .catch(function deleteEntityErrorHandler(errDelete) {
        logger.logServerWarn('Error deleting Entry again', {error: errDelete });
        notification.error('Error deleting Entry again');
        return $q.reject(errDelete);
      });
    }, function createEntityErrorHandler(errCreate) {
      logger.logServerWarn('Error creating Entry', {error: errCreate });
      notification.error('Error creating Entry');
      return $q.reject(errCreate);
    });
  };

  $scope.addNewAsset = function() {
    $scope.spaceContext.space.createAsset({})
    .then(function createEntityHandler(asset) {
      return addEntity(asset)
      .then(function addLinkHandler() {
        $scope.navigator.assetEditor(asset).goTo();
      })
      .catch(function addLinkErrorHandler(errSetLink) {
        logger.logServerWarn('Error linking Asset', {error: errSetLink });
        notification.error('Error linking Asset');
        return asset.delete();
      })
      .catch(function deleteEntityErrorHandler(errDelete) {
        logger.logServerWarn('Error deleting Asset again', {error: errDelete });
        notification.error('Error deleting Asset again');
        return $q.reject(errDelete);
      });
    }, function createEntityErrorHandler(errCreate) {
      logger.logServerWarn('Error creating Asset', {error: errCreate });
      notification.error('Error creating Asset');
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
      return entityLoader.loadPromise(function(){
        return $scope.spaceContext.space[fetchMethod](query);
      });
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
    if (singleContentType($scope.entityContentTypes))
      return singleContentType($scope.entityContentTypes);
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
      if ($scope.entityMimeTypeGroup) {
        var contentTypes = _.reduce($scope.entityMimeTypeGroup, function (contentTypes, mimetypeGroup) {
          return contentTypes.concat(mimetype.getTypesForGroup(mimetypeGroup));
        }, []);
        queryObject['fields.file.contentType[in]'] = contentTypes.join(',');
      }
    } else if ($scope.entityType === 'Entry') {
      if (singleContentType($scope.entityContentTypes)) {
        contentType = singleContentType($scope.entityContentTypes);
      } else if ($scope.entityContentTypes && $scope.entityContentTypes.length > 1) {
        queryObject['sys.contentType.sys.id[in]'] = _.map($scope.entityContentTypes, function (ct) {
          return ct.getId();
        }).join(',');
      }
    }

    return searchQueryHelper.buildQuery($scope.spaceContext.space, contentType, $scope.searchTerm)
    .then(function (searchQuery) {
      return _.extend(searchQuery, queryObject);
    });
  }

  function singleContentType(linkContentTypes) {
    if (_.isArray(linkContentTypes) && linkContentTypes.length === 1) {
      return linkContentTypes[0];
    }
    return false;
  }

}]);
