'use strict';

angular.module('contentful')
.controller('AssetListViewsController',
['$scope', '$injector', 'preserveState', function ($scope, $injector, preserveState) {

  var $controller = $injector.get('$controller');
  var uiConfig = $injector.get('uiConfig');

  return $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    viewCollectionName: 'assetListViews',
    generateDefaultViews: uiConfig.resetAssets,
    preserveStateAs: preserveState ? 'assets' : null,
    resetList: function () {
      $scope.searchController.resetAssets(true);
    }
  });

  function getBlankView () {
    return {
      id: null,
      title: 'New View',
      searchTerm: null
    };
  }
}]);
