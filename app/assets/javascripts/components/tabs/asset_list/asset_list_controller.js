'use strict';

angular.module('contentful').controller('AssetListCtrl',['$scope', '$injector', function AssetListCtrl($scope, $injector) {
  var $controller = $injector.get('$controller');
  var Selection   = $injector.get('Selection');

  $controller('AssetListViewsController', {
    $scope: $scope,
    currentViewLocation: 'tab.params.view'
  });
  $scope.searchController = $controller('AssetSearchController', {
    $scope:         $scope,
    getSearchTerm:  getSearchTerm
  });

  $scope.selection = new Selection();

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm:  scope.tab.params.view.searchTerm,
      page:        scope.searchController.paginator.page,
      pageLength:  scope.searchController.paginator.pageLength,
      spaceId:     (scope.spaceContext.space && scope.spaceContext.space.getId())
    };
  }, function(pageParameters, old, scope){
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);

  $scope.visibleInCurrentList = function(){
    // TODO: This needs to basically emulate the API :(
    return true;
  };

  $scope.hasQuery = function () {
    return !_.isEmpty($scope.tab.params.view.searchTerm);
  };

  $scope.statusClass = function(asset){
    if (asset.isPublished()) {
      if (asset.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'published';
      }
    } else if (asset.isArchived()) {
      return 'archived';
    } else {
      return 'draft';
    }
  };

  $scope.$on('didResetAssets', function (event, assets) {
    $scope.selection.switchBaseSet(assets.length);
  });

  $scope.$on('didLoadMoreAssets', function (event, assets) {
    $scope.selection.setBaseSize(assets.length);
  });

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.searchController.resetAssets();
  });

  function getSearchTerm() {
    return $scope.tab.params.view.searchTerm;
  }
}]);
