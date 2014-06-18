'use strict';

angular.module('contentful').controller('cfLinkEditorSearchCtrl', function($scope, Paginator, notification, PromisedLoader) {

  var entityLoader = new PromisedLoader();
  $scope.paginator = new Paginator();

  $scope.$watch('searchTerm', function(term, old, scope) {
    scope.resetEntities();
  });

  $scope.$on('autocompleteResultSelected', function (event, index, entity) {
    event.currentScope.selectedEntity = entity;
  });

  $scope.$on('autocompleteResultPicked', function (event, index, entity) {
    event.currentScope.addLink(entity, function(err) {
      if (err) event.preventDefault();
    });
  });

  $scope.$on('searchFieldFocused', function () {
    $scope.searchResultsVisible = true;
  });

  $scope.$on('refreshSearch', function (ev, params) {
    if(params && params.trigger == 'button'){
      $scope.resetEntities();
    }
  });

  $scope.pick = function (entity) {
    $scope.addLink(entity, function(err) {
      if (!err) {
        $scope.searchTerm = undefined;
        $scope.searchResultsVisible = false;
      }
    });
  };


  $scope.addNewEntry = function(contentType) {
    $scope.spaceContext.space.createEntry(contentType.getId(), {}, function(errCreate, entry){
      $scope.$apply(function (scope) {
        if (errCreate) {
          notification.serverError('Error creating Entry', errCreate);
          return;
        }
        scope.addLink(entry, function(errSetLink) {
          if (errSetLink) {
            notification.serverError('Error linking Entry', errSetLink);
            entry['delete'](function(errDelete) {
              scope.$apply(function () {
                if (errDelete) {
                  notification.serverError('Error deleting Entry again', errDelete);
                }
              });
            });
            return;
          }
          scope.navigator.entryEditor(entry).goTo();
        });
      });
    });
  };

  $scope.addNewAsset = function() {
    $scope.spaceContext.space.createAsset({}, function(errCreate, asset){
      $scope.$apply(function (scope) {
        if (errCreate) {
          notification.serverError('Error creating Asset', errCreate);
          return;
        }
        scope.addLink(asset, function(errSetLink) {
          if (errSetLink) {
            notification.serverError('Error linking Asset', errSetLink);
            asset['delete'](function(errDelete) {
              scope.$apply(function () {
                if (errDelete) {
                  notification.serverError('Error deleting Asset again', errDelete);
                }
              });
            });
            return;
          }
          scope.navigator.assetEditor(asset).goTo();
        });
      });
    });
  };

  // Custom check because an empty string should still be considered as a valid search
  $scope.searchIsEmpty = function () {
    return _.isEmpty($scope.searchTerm) && !_.isString($scope.searchTerm);
  };

  $scope.resetEntities = function() {
    if ($scope.searchIsEmpty()) {
      $scope.paginator.page = 0;
      $scope.entities = [];
      $scope.selectedEntity = null;
      $scope.searchResultsVisible = false;
    } else {
      $scope.loadEntities();
    }
  };

  $scope.loadEntities = function () {
    entityLoader.loadCallback(
      $scope.spaceContext.space, $scope.fetchMethod, buildQuery()
    ).then(function (entities) {
      $scope.searchResultsVisible = true;
      $scope.paginator.numEntries = entities.total;
      $scope.entities = entities;
      $scope.selectedEntity = entities[0];
    });
  };

  $scope.loadMore = function() {
    if ($scope.paginator.atLast()) return;
    $scope.paginator.page++;
    entityLoader.loadCallback(
      $scope.spaceContext.space, $scope.fetchMethod, buildQuery()
    ).then(function (entities) {
      $scope.paginator.numEntries = entities.total;
      $scope.entities.push.apply($scope.entities, entities);
    }, function () {
      $scope.paginator.page--;
    });
  };

  function buildQuery() {
    var queryObject = {
      order: '-sys.updatedAt',
      limit: $scope.paginator.pageLength,
      skip: $scope.paginator.skipItems()
    };

    if ($scope.linkContentType)
      queryObject['sys.contentType.sys.id'] = $scope.linkContentType.getId();
    if ($scope.linkMimetypeGroup){
      queryObject['mimetype_group'] = $scope.linkMimetypeGroup;
    }
    if ($scope.searchTerm && 0 < $scope.searchTerm.length)
      queryObject.query = $scope.searchTerm;

    return queryObject;
  }
});
