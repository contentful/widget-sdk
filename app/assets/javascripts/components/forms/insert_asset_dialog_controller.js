'use strict';
angular.module('contentful').controller('InsertAssetDialogController', ['$scope', '$injector', function($scope, $injector){
  var $controller       = $injector.get('$controller');
  var keycodes          = $injector.get('keycodes');
  var searchQueryHelper = $injector.get('searchQueryHelper');

  $scope.canEditUiConfig = false;
  $scope.currentView = null;
  $scope.assetContentType = searchQueryHelper.assetContentType;
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
      searchTerm:  scope.searchTerm,
      page:        scope.searchController.paginator.page,
      pageLength:  scope.searchController.paginator.pageLength,
    };
  }, function(pageParameters, old, scope){
    scope.searchController.resetAssets(pageParameters.page === old.page);
  }, true);


  $scope.entities = [];
  $scope.selectAsset = function (asset) {
    $scope.dialog.confirm(asset);
  };

  $scope.handleKeys = function (event) {
    if (event.keyCode === keycodes.ENTER) event.stopPropagation();
  };

  function getSearchTerm() {
    return $scope.searchTerm;
  }
}]);
