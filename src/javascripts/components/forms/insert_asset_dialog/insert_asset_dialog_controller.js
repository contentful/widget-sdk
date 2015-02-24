'use strict';

angular.module('contentful').controller('InsertAssetDialogController', ['$scope', '$injector', function($scope, $injector){
  var $controller       = $injector.get('$controller');
  var keycodes          = $injector.get('keycodes');
  var searchQueryHelper = $injector.get('searchQueryHelper');
  var Selection         = $injector.get('Selection');

  $scope.assetContentType = searchQueryHelper.assetContentType;
  $scope.canEditUiConfig  = false;
  $scope.currentView      = {searchTerm: null};
  $scope.assets           = [];
  $scope.selection        = new Selection();

  $controller('AssetListViewsController', {
    $scope: $scope,
    currentViewLocation: 'currentView'
  });
  $scope.searchController = $controller('AssetSearchController', {
    $scope: $scope,
    getSearchTerm: getSearchTerm
  });

  $scope.$watch(function pageParameters(scope){
    return {
      searchTerm:  scope.currentView.searchTerm,
      page:        scope.searchController.paginator.page,
      pageLength:  scope.searchController.paginator.pageLength,
    };
  }, function(pageParameters, old, scope){
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);


  $scope.selectAsset = function (asset) {
    $scope.selection.toggle(asset);
  };

  $scope.handleKeys = function (event) {
    if (event.keyCode === keycodes.ENTER) event.stopPropagation();
  };

  function getSearchTerm() {
    return $scope.currentView.searchTerm;
  }
}]);
