'use strict';

angular.module('contentful').controller('InsertAssetDialogController', ['$scope', '$injector', function($scope, $injector){
  var $controller       = $injector.get('$controller');
  var keycodes          = $injector.get('keycodes');
  var searchQueryHelper = $injector.get('searchQueryHelper');
  var Selection         = $injector.get('Selection');
  var spaceContext      = $injector.get('spaceContext');

  $scope.assetContentType = searchQueryHelper.assetContentType;
  $scope.spaceContext     = spaceContext;
  $scope.canEditUiConfig  = false;
  $scope.context          = { view: { searchTerm: null } };
  $scope.assets           = [];
  $scope.selection        = new Selection();

  $controller('UiConfigController', { $scope: $scope });

  $controller('AssetListViewsController', {
    $scope: $scope,
    preserveState: false
  });

  $scope.searchController = $controller('AssetSearchController', {
    $scope: $scope,
    getSearchTerm: getSearchTerm
  });

  $scope.$watch(function pageParameters(){
    return {
      searchTerm: getSearchTerm(),
      page:       $scope.searchController.paginator.page,
      pageLength: $scope.searchController.paginator.pageLength
    };
  }, function(pageParameters, prev){
    $scope.searchController.resetAssets(pageParameters.page === prev.page);
  }, true);

  $scope.selectAsset = function (asset) {
    $scope.selection.toggle(asset);
  };

  $scope.handleKeys = function (event) {
    if (event.keyCode === keycodes.ENTER) {
      event.stopPropagation();
    }
  };

  function getSearchTerm() {
    return $scope.context.view.searchTerm;
  }
}]);
