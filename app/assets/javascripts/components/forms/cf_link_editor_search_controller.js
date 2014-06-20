'use strict';

angular.module('contentful').controller('cfLinkEditorSearchCtrl', function($scope, Paginator, notification, PromisedLoader, $q, searchQueryHelper) {
  var controller = this;
  var entityLoader = new PromisedLoader();
  $scope.paginator = new Paginator();


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
  };

  this.showSearchResults = function () {
    this._searchResultsVisible = true;
  };

  $scope.$on('searchSubmitted', function () {
    controller._resetEntities();
  });

  $scope.$on('autocompleteResultSelected', function (event, index, entity) {
    event.currentScope.selectedEntity = entity;
  });

  $scope.$on('autocompleteResultPicked', function (event, index, entity) {
    event.currentScope.addLink(entity).catch(function(){
      event.preventDefault();
    });
  });

  $scope.pick = function (entity) {
    $scope.addLink(entity).then(function () {
      controller.clearSearch();
    });
  };

  $scope.addNewEntry = function(contentType) {
    var cb = $q.callback(), cbDelete = $q.callback();
    $scope.spaceContext.space.createEntry(contentType.getId(), {}, cb);
    return cb.promise
    .then(function createEntityHandler(entry) {
      return $scope.addLink(entry)
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
      return $scope.addLink(asset)
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

  function buildQuery() {
    var contentType;
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.linkType === 'Asset')
      contentType = searchQueryHelper.assetContentType;
    if ($scope.linkContentType)
      contentType = $scope.linkContentType;
    if ($scope.linkMimetypeGroup)
      queryObject['mimetype_group'] = $scope.linkMimetypeGroup;
      //TODO well, actually when the linkMimeTypeGroup is predefined, we shouldn't allow searching for it

    return searchQueryHelper.buildQuery($scope.spaceContext.space, $scope.linkContentType, $scope.searchTerm)
    .then(function (searchQuery) {
      _.extend(searchQuery, queryObject);
      return searchQuery;
    });
  }

});
